# Openapi.diff and the oasdiff check catalog

`Openapi.diff` compares two versions of an OpenAPI document and grades each change breaking, warning or compatible. This page is for teams running oasdiff: what `Openapi.diff` does with each oasdiff check, what you gain, and what it does not evaluate.

## Coverage at a glance

Of oasdiff 1.32.1's 755 checks (`oasdiff checks changelog --format json`), by oasdiff's level:

| | error | warning | info | All |
|---|---|---|---|---|
| Detected | 232 | 9 | 247 | **488** |
| Not evaluated | 92 | 8 | 112 | **212** |
| Declined | 15 | 0 | 40 | **55** |

- **Detected:** `Openapi.diff` reports the change as a finding, at its own proven level.
- **Not evaluated:** the change sits under a construct `Openapi.diff` does not evaluate. Each occurrence is listed in the result's `notEvaluated`, so it is never silently passed.
- **Declined:** deliberately not reported: the change is outside the contract `Openapi.diff` compares, or leaves that contract unchanged.

## What Openapi.diff does not evaluate

| Construct | Checks |
|---|---|
| a keyword `Openapi.diff` does not compare: `not`, `if`/`then`/`else`, `dependentSchemas`, `dependentRequired`, `patternProperties`, `propertyNames`, `unevaluated*`, `prefixItems`, `contains`/`minContains`/`maxContains`, `contentMediaType`/`contentEncoding`/`contentSchema`, operation- or path-level `servers`, `allowReserved`, `allowEmptyValue`, an `x-sunset` that is not a date, and any other keyword outside the compared set | 156 |
| the boolean `false` schema outside `additionalProperties` | 14 |
| `discriminator` | 24 |
| the internals of `components.securitySchemes` (an operation's `security` is compared) | 8 |
| `itemSchema` (OpenAPI 3.2) | 5 |
| a media-type parameter (`application/json; charset=…`); the media type itself is compared | 3 |
| a change whose inclusion cannot be decided symbolically (one `pattern` replaced by another) and for which no concrete instance proves a break | 2 |

Declined, by reason:

| Reason | Checks |
|---|---|
| A `readOnly` or `writeOnly` change on the side that never sees the property (`readOnly` is dropped from requests, `writeOnly` from responses) | 23 |
| An annotation-only `allOf` branch added or removed: it merges to the same contract | 8 |
| Out of scope: x-sunset is read on the operation only | 8 |
| Out of scope: x-stability-level is an x-* outside the three it reads (`x-extensible-enum`, `x-sunset`, `x-successor`) | 7 |
| Out of scope: info is not compared; a version-bump policy is a gate over the result, not a diff | 3 |
| Out of scope: tags are not compared | 2 |
| Not proven breaking, so not graded at oasdiff's error level | 2 |
| Out of scope: a component is judged at each usage; an unreferenced component changes no operation | 1 |
| Out of scope: a path parameter is its template position; a declaration added for an unchanged template is no contract change, a changed template is a different operation | 1 |

## Where it differs from oasdiff

**A level is given only when it is proven.** A change it cannot prove, or one under a construct it does not evaluate, is listed in `notEvaluated` instead of guessed. A breaking verdict proven by a concrete request or response carries that instance as a counterexample.

**Level disagreements.** On 71 of the 488 detected checks our level differs from oasdiff's (B breaking ≈ error, W warning ≈ warning, C compatible ≈ info):

- 57 stricter: some or all of the changes the check covers are graded above oasdiff's level, none below
- 11 more lenient: graded below, none above, because oasdiff's level is not proven
- 3 depends on the change: some graded above oasdiff's level, some below

| Check | oasdiff | Openapi.diff |
|---|---|---|
| `request-body-default-value-changed` | info | `DEFAULT_CHANGED` B |
| `api-path-removed-with-deprecation` | info | `OPERATION_REMOVED` B, `OPERATION_REMOVED_BEFORE_SUNSET` B |
| `response-optional-property-removed` | info | `PROPERTY_REMOVED` B required, else W |
| `response-property-pattern-changed` | warning | `CONSTRAINT_LOOSENED` B |
| `request-body-removed` | error | `REQUEST_BODY_REMOVED` W |
| `request-parameter-removed-before-sunset` | error | `PARAM_REMOVED` W |
| `sunset-deleted` | error | `SUNSET_REMOVED` C |
| `api-security-removed` | error | `SECURITY_TIGHTENED` B, `SECURITY_LOOSENED` C |

## Look up a check

In the engine, `Openapi.crosswalk('request-property-removed')` returns one check; `Openapi.crosswalk({disposition, level})` filters the list.

[`crosswalk.json`](crosswalk.json) holds every check: oasdiff's id, description and level, the disposition, and our kinds, direction, level, and code or reason. For example, the checks we grade stricter than oasdiff:

```sh
jq -r '.checks[] | select(.levelDifference == "stricter") | .id' crosswalk.json
```

This page and `crosswalk.json` are generated from the crosswalk shipped in the engine. Check ids, descriptions and levels are oasdiff's.
