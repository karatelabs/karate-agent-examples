# Openapi.diff — the oasdiff check crosswalk

`Openapi.diff` compares two versions of an OpenAPI document and reports each change as a finding: a kind, a direction (`request` — what the client sends, `response` — what it reads, or `none`) and a level, **B** breaking, **W** warning or **C** compatible. A level is given only when it is proven. A change it cannot prove, or one under a construct it does not evaluate, is listed in the result's `notEvaluated` instead.

This page maps every check in oasdiff 1.32.1's catalog (`oasdiff checks changelog --format json`, 755 checks) to how `Openapi.diff` treats the same change. Check ids and descriptions are oasdiff's. The page is generated from the crosswalk shipped in the engine; the same data is `Openapi.crosswalk('<check id>')`, `GET /api/openapi/crosswalk` and the console's `/checks/crosswalk` view. A finding names the detected checks it answers in its `oasdiff` field.

## How to read it

| Disposition | Checks | Meaning |
|---|---|---|
| [`detected`](#detected) | 488 | `Openapi.diff` emits a finding of the listed kinds, in the listed direction. Its level comes from the kind; **Our level** is filled in where it differs from oasdiff's (error ≈ B, warning ≈ W, info ≈ C). |
| [`notEvaluated`](#notevaluated) | 212 | The change sits under a construct `Openapi.diff` does not evaluate. The result's `notEvaluated` list names each occurrence with the code shown. |
| [`declined`](#declined) | 55 | `Openapi.diff` reads the construct but deliberately emits no finding of that kind, or it is outside the contract it compares. The reason says which. |

The `notEvaluated` codes:

| Code | Not evaluated |
|---|---|
| `KEYWORD` | a keyword `Openapi.diff` does not compare: `not`, `if`/`then`/`else`, `dependentSchemas`, `dependentRequired`, `patternProperties`, `propertyNames`, `unevaluated*`, `prefixItems`, `contains`/`minContains`/`maxContains`, `contentMediaType`/`contentEncoding`/`contentSchema`, operation- or path-level `servers`, `allowReserved`, `allowEmptyValue`, an `x-sunset` that is not a date, and any other keyword outside the compared set |
| `FALSE_SCHEMA` | the boolean `false` schema outside `additionalProperties` |
| `DISCRIMINATOR` | `discriminator` |
| `SECURITY_SCHEME` | the internals of `components.securitySchemes` (an operation's `security` is compared) |
| `OAS_VERSION` | `itemSchema` (OpenAPI 3.2) |
| `MEDIA_TYPE_PARAMS` | a media-type parameter (`application/json; charset=…`); the media type itself is compared |
| `NO_WITNESS` | a change whose inclusion cannot be decided symbolically (one `pattern` replaced by another) and for which no concrete instance proves a break |

## detected

488 checks.

### detected — oasdiff error

| Check | oasdiff description | Kinds | Direction | Our level |
|---|---|---|---|---|
| `api-deprecated-sunset-missing` | endpoint deprecated without sunset date | `DEPRECATION_ADDED` | — | DEPRECATION_ADDED C |
| `api-deprecated-sunset-parse` | endpoint deprecated with invalid sunset date | `DEPRECATION_ADDED`, `SUNSET_SET`, `SUNSET_CHANGED` | — | DEPRECATION_ADDED C, SUNSET_SET C, SUNSET_CHANGED C later, W earlier |
| `api-global-security-removed` | security scheme deleted in security | `SECURITY_TIGHTENED` | `none` |  |
| `api-global-security-scope-added` | scope added to a security scheme in security | `SECURITY_TIGHTENED` | `none` |  |
| `api-path-removed-before-sunset` | path and endpoint deleted before sunset date | `OPERATION_REMOVED_BEFORE_SUNSET`, `OPERATION_REMOVED` | `none` |  |
| `api-path-removed-without-deprecation` | path and endpoint deleted without deprecation | `OPERATION_REMOVED` | `none` |  |
| `api-path-sunset-parse` | path and endpoint deleted with invalid or missing sunset date | `OPERATION_REMOVED` | `none` |  |
| `api-removed-before-sunset` | endpoint deleted before sunset date | `OPERATION_REMOVED_BEFORE_SUNSET`, `OPERATION_REMOVED` | `none` |  |
| `api-removed-without-deprecation` | endpoint deleted without deprecation | `OPERATION_REMOVED` | `none` |  |
| `api-security-removed` | security requirements deleted from endpoint | `SECURITY_TIGHTENED`, `SECURITY_LOOSENED` | — | SECURITY_TIGHTENED B, SECURITY_LOOSENED C |
| `api-security-scope-added` | scope added to an endpoint's security scheme | `SECURITY_TIGHTENED` | `none` |  |
| `api-sunset-date-changed-too-small` | modified sunset date doesn't meet min required deprecation days | `SUNSET_CHANGED` | — | SUNSET_CHANGED C later, W earlier |
| `api-sunset-date-too-small` | deprecated endpoint sunset before min required deprecation days | `DEPRECATION_ADDED`, `SUNSET_SET`, `SUNSET_CHANGED` | — | DEPRECATION_ADDED C, SUNSET_SET C, SUNSET_CHANGED C later, W earlier |
| `new-required-request-default-parameter-to-existing-path` | required request parameter added at path level | `PARAM_ADDED_REQUIRED` | `request` |  |
| `new-required-request-header-property` | new required request header | `PROPERTY_ADDED_REQUIRED` | `request` |  |
| `new-required-request-parameter` | required request parameter added to endpoint | `PARAM_ADDED_REQUIRED` | `request` |  |
| `new-required-request-property` | required property added to request | `PROPERTY_ADDED_REQUIRED` | `request` |  |
| `new-required-request-property-with-default` | required property with default value added to request | `PROPERTY_ADDED_REQUIRED` | `request` |  |
| `request-body-added-required` | required request body added | `REQUEST_BODY_ADDED_REQUIRED` | `request` |  |
| `request-body-all-of-added` | sub-schema added to allOf in request body | `PROPERTY_ADDED_REQUIRED`, `PROPERTY_BECAME_REQUIRED`, `TYPE_NARROWED`, `CONSTRAINT_TIGHTENED`, `ENUM_VALUE_REMOVED` | `request` |  |
| `request-body-any-of-removed` | sub-schema deleted from anyOf in request body | `COMPOSITION_BRANCH_REMOVED` | `request` |  |
| `request-body-became-enum` | request body restricted to enum | `CONSTRAINT_TIGHTENED` on `enum` | `request` |  |
| `request-body-became-not-nullable` | null excluded as a possible value in request body | `NULLABLE_REMOVED` | `request` |  |
| `request-body-became-required` | request body became required | `REQUEST_BODY_BECAME_REQUIRED` | `request` |  |
| `request-body-const-added` | request body const value set | `CONSTRAINT_TIGHTENED` on `const` | `request` |  |
| `request-body-const-changed` | request body const value modified | `CONSTRAINT_CHANGED` on `const` | `request` |  |
| `request-body-enum-value-removed` | request body enum value deleted | `ENUM_VALUE_REMOVED` | `request` |  |
| `request-body-exclusive-max-decreased` | request body exclusiveMaximum decreased | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `request` |  |
| `request-body-exclusive-max-set` | request body exclusiveMaximum set | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `request` |  |
| `request-body-exclusive-min-increased` | request body exclusiveMinimum increased | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `request` |  |
| `request-body-exclusive-min-set` | request body exclusiveMinimum set | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `request` |  |
| `request-body-list-of-types-narrowed` | request body list-of-types narrowed | `COMPOSITION_BRANCH_REMOVED`, `TYPE_NARROWED`, `TYPE_CHANGED` | `request` |  |
| `request-body-max-decreased` | request body max decreased | `CONSTRAINT_TIGHTENED` on `maximum` | `request` |  |
| `request-body-max-items-decreased` | request body max items decreased | `CONSTRAINT_TIGHTENED` on `maxItems` | `request` |  |
| `request-body-max-items-set` | request body max items set | `CONSTRAINT_TIGHTENED` on `maxItems` | `request` |  |
| `request-body-max-length-decreased` | request body max length decreased | `CONSTRAINT_TIGHTENED` on `maxLength` | `request` |  |
| `request-body-max-length-set` | request body max length set | `CONSTRAINT_TIGHTENED` on `maxLength` | `request` |  |
| `request-body-max-properties-decreased` | request body max properties decreased | `CONSTRAINT_TIGHTENED` on `maxProperties` | `request` |  |
| `request-body-max-properties-set` | request body max properties set | `CONSTRAINT_TIGHTENED` on `maxProperties` | `request` |  |
| `request-body-max-set` | request body max set | `CONSTRAINT_TIGHTENED` on `maximum` | `request` |  |
| `request-body-media-type-removed` | request body media-type deleted | `REQUEST_MEDIA_TYPE_REMOVED` | `request` |  |
| `request-body-media-type-schema-added` | request body media-type schema added | `SCHEMA_ADDED` | `request` |  |
| `request-body-min-increased` | request body min increased | `CONSTRAINT_TIGHTENED` on `minimum` | `request` |  |
| `request-body-min-items-increased` | request body min items increased | `CONSTRAINT_TIGHTENED` on `minItems` | `request` |  |
| `request-body-min-items-set` | request body min items set | `CONSTRAINT_TIGHTENED` on `minItems` | `request` |  |
| `request-body-min-length-increased` | request body min length increased | `CONSTRAINT_TIGHTENED` on `minLength` | `request` |  |
| `request-body-min-length-set` | request body minLength set | `CONSTRAINT_TIGHTENED` on `minLength` | `request` |  |
| `request-body-min-properties-increased` | request body min properties increased | `CONSTRAINT_TIGHTENED` on `minProperties` | `request` |  |
| `request-body-min-properties-set` | request body minProperties set | `CONSTRAINT_TIGHTENED` on `minProperties` | `request` |  |
| `request-body-min-set` | request body min set | `CONSTRAINT_TIGHTENED` on `minimum` | `request` |  |
| `request-body-multiple-of-changed` | request body multipleOf changed | `CONSTRAINT_TIGHTENED`, `CONSTRAINT_CHANGED` on `multipleOf` | `request` |  |
| `request-body-multiple-of-set` | request body multipleOf set | `CONSTRAINT_TIGHTENED` on `multipleOf` | `request` |  |
| `request-body-one-of-removed` | sub-schema deleted from oneOf in request body | `COMPOSITION_BRANCH_REMOVED` | `request` |  |
| `request-body-removed` | request body removed | `REQUEST_BODY_REMOVED` | — | REQUEST_BODY_REMOVED W |
| `request-body-type-changed` | request body type changed | `TYPE_CHANGED`, `TYPE_NARROWED`, `CONSTRAINT_CHANGED`, `CONSTRAINT_TIGHTENED`, `COMPOSITION_BRANCH_REMOVED` | `request` |  |
| `request-body-unique-items-set` | request body uniqueItems set | `CONSTRAINT_TIGHTENED` on `uniqueItems` | `request` |  |
| `request-body-wrapped-in-one-of` | request body wrapped in a oneOf | `COMPOSITION_BRANCH_REMOVED` | `request` |  |
| `request-header-property-became-enum` | request header property restricted to enum | `CONSTRAINT_TIGHTENED` on `enum` | `request` |  |
| `request-header-property-became-required` | request header property became required | `PROPERTY_BECAME_REQUIRED` | `request` |  |
| `request-parameter-became-enum` | request parameter restricted to enum | `CONSTRAINT_TIGHTENED` on `enum` | `request` |  |
| `request-parameter-became-not-nullable` | request parameter became not nullable | `NULLABLE_REMOVED` | `request` |  |
| `request-parameter-became-required` | request parameter became required | `PARAM_BECAME_REQUIRED` | `request` |  |
| `request-parameter-deprecated-sunset-missing` | request parameter deprecated without sunset date | `DEPRECATION_ADDED` | — | DEPRECATION_ADDED C |
| `request-parameter-enum-value-removed` | request parameter enum value deleted | `ENUM_VALUE_REMOVED` | `request` |  |
| `request-parameter-exclusive-max-decreased` | request parameter exclusiveMaximum decreased | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `request` |  |
| `request-parameter-exclusive-max-set` | request parameter exclusiveMaximum set | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `request` |  |
| `request-parameter-exclusive-min-increased` | request parameter exclusiveMinimum increased | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `request` |  |
| `request-parameter-exclusive-min-set` | request parameter exclusiveMinimum set | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `request` |  |
| `request-parameter-list-of-types-narrowed` | request parameter list-of-types narrowed | `COMPOSITION_BRANCH_REMOVED`, `TYPE_NARROWED`, `TYPE_CHANGED` | `request` |  |
| `request-parameter-max-decreased` | request parameter max decreased | `CONSTRAINT_TIGHTENED` on `maximum` | `request` |  |
| `request-parameter-max-items-decreased` | request parameter max items decreased | `CONSTRAINT_TIGHTENED` on `maxItems` | `request` |  |
| `request-parameter-max-items-set` | request parameter maxItems set | `CONSTRAINT_TIGHTENED` on `maxItems` | `request` |  |
| `request-parameter-max-length-decreased` | request parameter max length decreased | `CONSTRAINT_TIGHTENED` on `maxLength` | `request` |  |
| `request-parameter-max-length-set` | request parameter max length set | `CONSTRAINT_TIGHTENED` on `maxLength` | `request` |  |
| `request-parameter-max-properties-decreased` | request parameter maxProperties decreased | `CONSTRAINT_TIGHTENED` on `maxProperties` | `request` |  |
| `request-parameter-max-properties-set` | request parameter maxProperties set | `CONSTRAINT_TIGHTENED` on `maxProperties` | `request` |  |
| `request-parameter-max-set` | request parameter max set | `CONSTRAINT_TIGHTENED` on `maximum` | `request` |  |
| `request-parameter-min-increased` | request parameter min increased | `CONSTRAINT_TIGHTENED` on `minimum` | `request` |  |
| `request-parameter-min-items-increased` | request parameter min items increased | `CONSTRAINT_TIGHTENED` on `minItems` | `request` |  |
| `request-parameter-min-items-set` | request parameter min items set | `CONSTRAINT_TIGHTENED` on `minItems` | `request` |  |
| `request-parameter-min-length-increased` | request parameter min length increased | `CONSTRAINT_TIGHTENED` on `minLength` | `request` |  |
| `request-parameter-min-length-set` | request parameter minLength set | `CONSTRAINT_TIGHTENED` on `minLength` | `request` |  |
| `request-parameter-min-properties-increased` | request parameter minProperties increased | `CONSTRAINT_TIGHTENED` on `minProperties` | `request` |  |
| `request-parameter-min-properties-set` | request parameter minProperties set | `CONSTRAINT_TIGHTENED` on `minProperties` | `request` |  |
| `request-parameter-min-set` | request parameter min set | `CONSTRAINT_TIGHTENED` on `minimum` | `request` |  |
| `request-parameter-multiple-of-set` | request parameter multipleOf set | `CONSTRAINT_TIGHTENED` on `multipleOf` | `request` |  |
| `request-parameter-pattern-added` | request parameter pattern set | `CONSTRAINT_TIGHTENED` on `pattern` | `request` |  |
| `request-parameter-property-became-not-nullable` | request parameter property became not nullable | `NULLABLE_REMOVED` | `request` |  |
| `request-parameter-property-enum-value-removed` | request parameter property enum value removed | `ENUM_VALUE_REMOVED` | `request` |  |
| `request-parameter-property-list-of-types-narrowed` | request parameter property list-of-types narrowed | `COMPOSITION_BRANCH_REMOVED`, `TYPE_NARROWED`, `TYPE_CHANGED` | `request` |  |
| `request-parameter-property-type-specialized` | request parameter property type specialized | `TYPE_NARROWED`, `CONSTRAINT_TIGHTENED`, `TYPE_CHANGED`, `COMPOSITION_BRANCH_REMOVED`, `CONSTRAINT_CHANGED` | `request` |  |
| `request-parameter-removed-before-sunset` | request parameter deleted before sunset date | `PARAM_REMOVED` | — | PARAM_REMOVED W |
| `request-parameter-type-changed` | request parameter type changed | `TYPE_CHANGED`, `TYPE_NARROWED`, `CONSTRAINT_CHANGED`, `CONSTRAINT_TIGHTENED`, `COMPOSITION_BRANCH_REMOVED` | `request` |  |
| `request-property-all-of-added` | sub-schema added to allOf in request property | `PROPERTY_ADDED_REQUIRED`, `PROPERTY_BECAME_REQUIRED`, `TYPE_NARROWED`, `CONSTRAINT_TIGHTENED`, `ENUM_VALUE_REMOVED` | `request` |  |
| `request-property-any-of-removed` | sub-schema deleted from anyOf in request property | `COMPOSITION_BRANCH_REMOVED` | `request` |  |
| `request-property-became-enum` | request property restricted to enum | `CONSTRAINT_TIGHTENED` on `enum` | `request` |  |
| `request-property-became-not-nullable` | request property became not nullable | `NULLABLE_REMOVED` | `request` |  |
| `request-property-became-required` | request property became required | `PROPERTY_BECAME_REQUIRED` | `request` |  |
| `request-property-became-required-with-default` | request property with a default value became required | `PROPERTY_BECAME_REQUIRED` | `request` |  |
| `request-property-const-added` | request property const value set | `CONSTRAINT_TIGHTENED` on `const` | `request` |  |
| `request-property-const-changed` | request property const value modified | `CONSTRAINT_CHANGED` on `const` | `request` |  |
| `request-property-deprecated-sunset-missing` | request property deprecated without sunset date | `DEPRECATION_ADDED` | — | DEPRECATION_ADDED C |
| `request-property-enum-value-removed` | request property enum value removed | `ENUM_VALUE_REMOVED` | `request` |  |
| `request-property-exclusive-max-decreased` | request property exclusiveMaximum decreased | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `request` |  |
| `request-property-exclusive-max-set` | request property exclusiveMaximum set | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `request` |  |
| `request-property-exclusive-min-increased` | request property exclusiveMinimum increased | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `request` |  |
| `request-property-exclusive-min-set` | request property exclusiveMinimum set | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `request` |  |
| `request-property-list-of-types-narrowed` | request property list-of-types narrowed | `COMPOSITION_BRANCH_REMOVED`, `TYPE_NARROWED`, `TYPE_CHANGED` | `request` |  |
| `request-property-max-decreased` | request property max decreased | `CONSTRAINT_TIGHTENED` on `maximum` | `request` |  |
| `request-property-max-items-decreased` | request property max items decreased | `CONSTRAINT_TIGHTENED` on `maxItems` | `request` |  |
| `request-property-max-items-set` | request property max items set | `CONSTRAINT_TIGHTENED` on `maxItems` | `request` |  |
| `request-property-max-length-decreased` | request property max length decreased | `CONSTRAINT_TIGHTENED` on `maxLength` | `request` |  |
| `request-property-max-length-set` | request property max length set | `CONSTRAINT_TIGHTENED` on `maxLength` | `request` |  |
| `request-property-max-properties-decreased` | request property max properties decreased | `CONSTRAINT_TIGHTENED` on `maxProperties` | `request` |  |
| `request-property-max-properties-set` | request property max properties set | `CONSTRAINT_TIGHTENED` on `maxProperties` | `request` |  |
| `request-property-max-set` | request property max set | `CONSTRAINT_TIGHTENED` on `maximum` | `request` |  |
| `request-property-min-increased` | request property min increased | `CONSTRAINT_TIGHTENED` on `minimum` | `request` |  |
| `request-property-min-items-increased` | request property min items increased | `CONSTRAINT_TIGHTENED` on `minItems` | `request` |  |
| `request-property-min-items-set` | request property min items set | `CONSTRAINT_TIGHTENED` on `minItems` | `request` |  |
| `request-property-min-length-increased` | request property min length increased | `CONSTRAINT_TIGHTENED` on `minLength` | `request` |  |
| `request-property-min-length-set` | request property minLength set | `CONSTRAINT_TIGHTENED` on `minLength` | `request` |  |
| `request-property-min-properties-increased` | request property min properties increased | `CONSTRAINT_TIGHTENED` on `minProperties` | `request` |  |
| `request-property-min-properties-set` | request property minProperties set | `CONSTRAINT_TIGHTENED` on `minProperties` | `request` |  |
| `request-property-min-set` | request property min set | `CONSTRAINT_TIGHTENED` on `minimum` | `request` |  |
| `request-property-multiple-of-changed` | request property multipleOf changed | `CONSTRAINT_TIGHTENED`, `CONSTRAINT_CHANGED` on `multipleOf` | `request` |  |
| `request-property-multiple-of-set` | request property multipleOf set | `CONSTRAINT_TIGHTENED` on `multipleOf` | `request` |  |
| `request-property-one-of-removed` | sub-schema deleted from oneOf in request property | `COMPOSITION_BRANCH_REMOVED` | `request` |  |
| `request-property-pattern-added` | request property pattern set | `CONSTRAINT_TIGHTENED` on `pattern` | `request` |  |
| `request-property-type-changed` | request property type changed | `TYPE_CHANGED`, `TYPE_NARROWED`, `CONSTRAINT_CHANGED`, `CONSTRAINT_TIGHTENED`, `COMPOSITION_BRANCH_REMOVED` | `request` |  |
| `request-property-unique-items-set` | request property uniqueItems set | `CONSTRAINT_TIGHTENED` on `uniqueItems` | `request` |  |
| `required-response-header-removed` | required response header removed | `RESPONSE_HEADER_REMOVED` | `response` |  |
| `response-body-all-of-removed` | sub-schema removed from allOf in response body | `PROPERTY_REMOVED`, `PROPERTY_BECAME_OPTIONAL`, `TYPE_WIDENED`, `CONSTRAINT_LOOSENED`, `ENUM_VALUE_ADDED` | `response` |  |
| `response-body-any-of-added` | sub-schema added to anyOf in response body | `COMPOSITION_BRANCH_ADDED` | `response` |  |
| `response-body-became-nullable` | response body became nullable | `NULLABLE_ADDED` | `response` |  |
| `response-body-const-changed` | response body const value modified | `CONSTRAINT_CHANGED` on `const` | `response` |  |
| `response-body-const-removed` | response body const value unset | `CONSTRAINT_LOOSENED` on `const` | `response` |  |
| `response-body-exclusive-max-increased` | response body exclusiveMaximum increased | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `response` |  |
| `response-body-exclusive-max-unset` | response body exclusiveMaximum unset | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `response` |  |
| `response-body-exclusive-min-decreased` | response body exclusiveMinimum decreased | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `response` |  |
| `response-body-exclusive-min-unset` | response body exclusiveMinimum unset | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `response` |  |
| `response-body-list-of-types-widened` | response body list-of-types widened | `COMPOSITION_BRANCH_ADDED`, `TYPE_WIDENED`, `TYPE_CHANGED` | `response` |  |
| `response-body-max-increased` | response body max increased | `CONSTRAINT_LOOSENED` on `maximum` | `response` |  |
| `response-body-max-items-increased` | response body max items increased | `CONSTRAINT_LOOSENED` on `maxItems` | `response` |  |
| `response-body-max-items-unset` | response body maxItems unset | `CONSTRAINT_LOOSENED` on `maxItems` | `response` |  |
| `response-body-max-length-increased` | response body max length increased | `CONSTRAINT_LOOSENED` on `maxLength` | `response` |  |
| `response-body-max-length-unset` | response body max length unset | `CONSTRAINT_LOOSENED` on `maxLength` | `response` |  |
| `response-body-max-properties-increased` | response body max properties increased | `CONSTRAINT_LOOSENED` on `maxProperties` | `response` |  |
| `response-body-max-properties-unset` | response body maxProperties unset | `CONSTRAINT_LOOSENED` on `maxProperties` | `response` |  |
| `response-body-max-unset` | response body max unset | `CONSTRAINT_LOOSENED` on `maximum` | `response` |  |
| `response-body-media-type-schema-removed` | response media-type schema removed | `SCHEMA_REMOVED` | `response` |  |
| `response-body-min-decreased` | response body min decreased | `CONSTRAINT_LOOSENED` on `minimum` | `response` |  |
| `response-body-min-items-decreased` | response body min items decreased | `CONSTRAINT_LOOSENED` on `minItems` | `response` |  |
| `response-body-min-items-unset` | response body min items unset | `CONSTRAINT_LOOSENED` on `minItems` | `response` |  |
| `response-body-min-length-decreased` | response body min length decreased | `CONSTRAINT_LOOSENED` on `minLength` | `response` |  |
| `response-body-min-length-unset` | response body minLength unset | `CONSTRAINT_LOOSENED` on `minLength` | `response` |  |
| `response-body-min-properties-decreased` | response body min properties decreased | `CONSTRAINT_LOOSENED` on `minProperties` | `response` |  |
| `response-body-min-properties-unset` | response body minProperties unset | `CONSTRAINT_LOOSENED` on `minProperties` | `response` |  |
| `response-body-min-unset` | response body min unset | `CONSTRAINT_LOOSENED` on `minimum` | `response` |  |
| `response-body-multiple-of-changed` | response body multipleOf changed | `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` on `multipleOf` | `response` |  |
| `response-body-multiple-of-unset` | response body multipleOf unset | `CONSTRAINT_LOOSENED` on `multipleOf` | `response` |  |
| `response-body-one-of-added` | sub-schema added to oneOf in response body | `COMPOSITION_BRANCH_ADDED` | `response` |  |
| `response-body-type-changed` | response body type changed | `TYPE_CHANGED`, `TYPE_WIDENED`, `CONSTRAINT_CHANGED`, `CONSTRAINT_LOOSENED`, `COMPOSITION_BRANCH_ADDED` | `response` |  |
| `response-body-type-generalized` | response body type generalized | `TYPE_WIDENED`, `CONSTRAINT_LOOSENED`, `TYPE_CHANGED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_CHANGED` | `response` |  |
| `response-body-unique-items-unset` | response body uniqueItems unset | `CONSTRAINT_LOOSENED` on `uniqueItems` | `response` |  |
| `response-body-wrapped-in-one-of` | response body wrapped in a oneOf | `COMPOSITION_BRANCH_ADDED` | `response` |  |
| `response-header-became-nullable` | response header became nullable | `NULLABLE_ADDED` | `response` |  |
| `response-header-became-optional` | response header became optional | `RESPONSE_HEADER_BECAME_OPTIONAL` | `response` |  |
| `response-header-exclusive-max-increased` | response header exclusiveMaximum increased | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `response` |  |
| `response-header-exclusive-max-unset` | response header exclusiveMaximum unset | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `response` |  |
| `response-header-exclusive-min-decreased` | response header exclusiveMinimum decreased | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `response` |  |
| `response-header-exclusive-min-unset` | response header exclusiveMinimum unset | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `response` |  |
| `response-header-max-increased` | response header max increased | `CONSTRAINT_LOOSENED` on `maximum` | `response` |  |
| `response-header-max-items-increased` | response header maxItems increased | `CONSTRAINT_LOOSENED` on `maxItems` | `response` |  |
| `response-header-max-items-unset` | response header maxItems unset | `CONSTRAINT_LOOSENED` on `maxItems` | `response` |  |
| `response-header-max-length-increased` | response header maxLength increased | `CONSTRAINT_LOOSENED` on `maxLength` | `response` |  |
| `response-header-max-length-unset` | response header maxLength unset | `CONSTRAINT_LOOSENED` on `maxLength` | `response` |  |
| `response-header-max-properties-increased` | response header maxProperties increased | `CONSTRAINT_LOOSENED` on `maxProperties` | `response` |  |
| `response-header-max-properties-unset` | response header maxProperties unset | `CONSTRAINT_LOOSENED` on `maxProperties` | `response` |  |
| `response-header-max-unset` | response header max unset | `CONSTRAINT_LOOSENED` on `maximum` | `response` |  |
| `response-header-min-decreased` | response header min decreased | `CONSTRAINT_LOOSENED` on `minimum` | `response` |  |
| `response-header-min-items-decreased` | response header minItems decreased | `CONSTRAINT_LOOSENED` on `minItems` | `response` |  |
| `response-header-min-items-unset` | response header minItems unset | `CONSTRAINT_LOOSENED` on `minItems` | `response` |  |
| `response-header-min-length-decreased` | response header minLength decreased | `CONSTRAINT_LOOSENED` on `minLength` | `response` |  |
| `response-header-min-length-unset` | response header minLength unset | `CONSTRAINT_LOOSENED` on `minLength` | `response` |  |
| `response-header-min-properties-decreased` | response header minProperties decreased | `CONSTRAINT_LOOSENED` on `minProperties` | `response` |  |
| `response-header-min-properties-unset` | response header minProperties unset | `CONSTRAINT_LOOSENED` on `minProperties` | `response` |  |
| `response-header-min-unset` | response header min unset | `CONSTRAINT_LOOSENED` on `minimum` | `response` |  |
| `response-header-multiple-of-unset` | response header multipleOf unset | `CONSTRAINT_LOOSENED` on `multipleOf` | `response` |  |
| `response-header-type-changed` | response header type changed | `TYPE_CHANGED`, `TYPE_WIDENED`, `CONSTRAINT_CHANGED`, `CONSTRAINT_LOOSENED`, `COMPOSITION_BRANCH_ADDED` | `response` |  |
| `response-header-type-generalized` | response header type generalized | `TYPE_WIDENED`, `CONSTRAINT_LOOSENED`, `TYPE_CHANGED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_CHANGED` | `response` |  |
| `response-media-type-name-generalized` | response media type changed to a more general type | `RESPONSE_MEDIA_TYPE_REMOVED` | `response` |  |
| `response-media-type-removed` | response media type removed | `RESPONSE_MEDIA_TYPE_REMOVED` | `response` |  |
| `response-property-all-of-removed` | sub-schema removed from allOf in response property | `PROPERTY_REMOVED`, `PROPERTY_BECAME_OPTIONAL`, `TYPE_WIDENED`, `CONSTRAINT_LOOSENED`, `ENUM_VALUE_ADDED` | `response` |  |
| `response-property-any-of-added` | sub-schema added to anyOf in response property | `COMPOSITION_BRANCH_ADDED` | `response` |  |
| `response-property-became-nullable` | response property became nullable | `NULLABLE_ADDED` | `response` |  |
| `response-property-became-optional` | response property became optional | `PROPERTY_BECAME_OPTIONAL` | `response` |  |
| `response-property-const-changed` | response property const value modified | `CONSTRAINT_CHANGED` on `const` | `response` |  |
| `response-property-const-removed` | response property const value unset | `CONSTRAINT_LOOSENED` on `const` | `response` |  |
| `response-property-deprecated-sunset-missing` | response property deprecated without sunset date | `DEPRECATION_ADDED` | — | DEPRECATION_ADDED C |
| `response-property-enum-value-added` | response property enum value added | `ENUM_VALUE_ADDED` | `response` |  |
| `response-property-exclusive-max-increased` | response property exclusiveMaximum increased | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `response` |  |
| `response-property-exclusive-max-unset` | response property exclusiveMaximum unset | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `response` |  |
| `response-property-exclusive-min-decreased` | response property exclusiveMinimum decreased | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `response` |  |
| `response-property-exclusive-min-unset` | response property exclusiveMinimum unset | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `response` |  |
| `response-property-list-of-types-widened` | response property list-of-types widened | `COMPOSITION_BRANCH_ADDED`, `TYPE_WIDENED`, `TYPE_CHANGED` | `response` |  |
| `response-property-max-increased` | response property max increased | `CONSTRAINT_LOOSENED` on `maximum` | `response` |  |
| `response-property-max-items-increased` | response property max items increased | `CONSTRAINT_LOOSENED` on `maxItems` | `response` |  |
| `response-property-max-items-unset` | response property maxItems unset | `CONSTRAINT_LOOSENED` on `maxItems` | `response` |  |
| `response-property-max-length-increased` | response property max length increased | `CONSTRAINT_LOOSENED` on `maxLength` | `response` |  |
| `response-property-max-length-unset` | response property max length unset | `CONSTRAINT_LOOSENED` on `maxLength` | `response` |  |
| `response-property-max-properties-increased` | response property max properties increased | `CONSTRAINT_LOOSENED` on `maxProperties` | `response` |  |
| `response-property-max-properties-unset` | response property maxProperties unset | `CONSTRAINT_LOOSENED` on `maxProperties` | `response` |  |
| `response-property-max-unset` | response property max unset | `CONSTRAINT_LOOSENED` on `maximum` | `response` |  |
| `response-property-min-decreased` | response property min decreased | `CONSTRAINT_LOOSENED` on `minimum` | `response` |  |
| `response-property-min-items-decreased` | response property min items decreased | `CONSTRAINT_LOOSENED` on `minItems` | `response` |  |
| `response-property-min-items-unset` | response property min items unset | `CONSTRAINT_LOOSENED` on `minItems` | `response` |  |
| `response-property-min-length-decreased` | response property min length decreased | `CONSTRAINT_LOOSENED` on `minLength` | `response` |  |
| `response-property-min-length-unset` | response property minLength unset | `CONSTRAINT_LOOSENED` on `minLength` | `response` |  |
| `response-property-min-properties-decreased` | response property min properties decreased | `CONSTRAINT_LOOSENED` on `minProperties` | `response` |  |
| `response-property-min-properties-unset` | response property minProperties unset | `CONSTRAINT_LOOSENED` on `minProperties` | `response` |  |
| `response-property-min-unset` | response property min unset | `CONSTRAINT_LOOSENED` on `minimum` | `response` |  |
| `response-property-multiple-of-changed` | response property multipleOf changed | `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` on `multipleOf` | `response` |  |
| `response-property-multiple-of-unset` | response property multipleOf unset | `CONSTRAINT_LOOSENED` on `multipleOf` | `response` |  |
| `response-property-one-of-added` | sub-schema added to oneOf in response property | `COMPOSITION_BRANCH_ADDED` | `response` |  |
| `response-property-pattern-removed` | response property pattern unset | `CONSTRAINT_LOOSENED` on `pattern` | `response` |  |
| `response-property-type-changed` | response property type changed | `TYPE_CHANGED`, `TYPE_WIDENED`, `CONSTRAINT_CHANGED`, `CONSTRAINT_LOOSENED`, `COMPOSITION_BRANCH_ADDED` | `response` |  |
| `response-property-type-generalized` | response property type generalized | `TYPE_WIDENED`, `CONSTRAINT_LOOSENED`, `TYPE_CHANGED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_CHANGED` | `response` |  |
| `response-property-unique-items-unset` | response property uniqueItems unset | `CONSTRAINT_LOOSENED` on `uniqueItems` | `response` |  |
| `response-required-property-removed` | response required property removed | `PROPERTY_REMOVED` | `response` |  |
| `response-success-status-removed` | response success status removed | `RESPONSE_SUCCESS_STATUS_REMOVED` | `response` |  |
| `sunset-deleted` | sunset deleted | `SUNSET_REMOVED` | — | SUNSET_REMOVED C |
| `webhook-removed` | webhook removed | `OPERATION_REMOVED`, `OPERATION_REMOVED_BEFORE_SUNSET` | `none` |  |

### detected — oasdiff warning

| Check | oasdiff description | Kinds | Direction | Our level |
|---|---|---|---|---|
| `request-body-wrapped-in-one-of-original-preserved` | request body wrapped in a oneOf that keeps the original schema | `COMPOSITION_BRANCH_ADDED`, `COMPOSITION_BRANCH_REMOVED` | `request` | COMPOSITION_BRANCH_ADDED C, COMPOSITION_BRANCH_REMOVED B |
| `request-parameter-pattern-changed` | request parameter pattern changed | `CONSTRAINT_TIGHTENED` on `pattern` | `request` | CONSTRAINT_TIGHTENED B |
| `request-parameter-property-type-changed` | request parameter property type changed | `TYPE_NARROWED`, `TYPE_CHANGED`, `COMPOSITION_BRANCH_REMOVED`, `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_TIGHTENED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `request` | TYPE_NARROWED B, TYPE_CHANGED B, COMPOSITION_BRANCH_REMOVED B, TYPE_WIDENED C, COMPOSITION_BRANCH_ADDED C, CONSTRAINT_TIGHTENED B, CONSTRAINT_LOOSENED C, CONSTRAINT_CHANGED B |
| `request-parameter-removed` | request parameter deleted | `PARAM_REMOVED` | `request` |  |
| `request-property-pattern-changed` | request property pattern changed | `CONSTRAINT_TIGHTENED` on `pattern` | `request` | CONSTRAINT_TIGHTENED B |
| `request-property-removed` | request property removed | `PROPERTY_REMOVED` | `request` |  |
| `response-body-wrapped-in-one-of-original-preserved` | response body wrapped in a oneOf that keeps the original schema | `COMPOSITION_BRANCH_ADDED` | `response` | COMPOSITION_BRANCH_ADDED B |
| `response-media-type-name-changed` | response media type changed | `RESPONSE_MEDIA_TYPE_REMOVED`, `RESPONSE_MEDIA_TYPE_ADDED` | `response` | RESPONSE_MEDIA_TYPE_REMOVED B, RESPONSE_MEDIA_TYPE_ADDED C |
| `response-property-pattern-changed` | response property pattern changed | `CONSTRAINT_LOOSENED` on `pattern` | `response` | CONSTRAINT_LOOSENED B |

### detected — oasdiff info

| Check | oasdiff description | Kinds | Direction | Our level |
|---|---|---|---|---|
| `api-global-security-added` | security scheme added in security | `SECURITY_LOOSENED`, `SECURITY_TIGHTENED` | `none` | SECURITY_LOOSENED C, SECURITY_TIGHTENED B |
| `api-global-security-scope-removed` | scope deleted from a security scheme in security | `SECURITY_LOOSENED` | `none` |  |
| `api-operation-id-added` | operation ID added to an endpoint | `OPERATION_ID_CHANGED` | `none` | OPERATION_ID_CHANGED W |
| `api-operation-id-removed` | operation ID deleted from an endpoint | `OPERATION_ID_CHANGED` | `none` | OPERATION_ID_CHANGED W |
| `api-path-removed-with-deprecation` | path and endpoint deleted after deprecation | `OPERATION_REMOVED`, `OPERATION_REMOVED_BEFORE_SUNSET` | `none` | OPERATION_REMOVED B, OPERATION_REMOVED_BEFORE_SUNSET B |
| `api-removed-with-deprecation` | endpoint deleted after deprecation | `OPERATION_REMOVED`, `OPERATION_REMOVED_BEFORE_SUNSET` | `none` | OPERATION_REMOVED B, OPERATION_REMOVED_BEFORE_SUNSET B |
| `api-security-added` | security requirements added to endpoint | `SECURITY_LOOSENED`, `SECURITY_TIGHTENED` | `none` | SECURITY_LOOSENED C, SECURITY_TIGHTENED B |
| `api-security-scope-removed` | scope deleted from an endpoint's security scheme | `SECURITY_LOOSENED` | `none` |  |
| `endpoint-added` | endpoint added | `OPERATION_ADDED` | `none` |  |
| `endpoint-deprecated` | endpoint deprecated | `DEPRECATION_ADDED` | `none` |  |
| `endpoint-deprecated-with-sunset` | endpoint deprecated with sunset date | `DEPRECATION_ADDED`, `SUNSET_SET` | `none` |  |
| `endpoint-reactivated` | endpoint reactivated (deprecation set to false) | `DEPRECATION_REMOVED` | `none` |  |
| `new-optional-request-default-parameter-to-existing-path` | optional request parameter added at path level | `PARAM_ADDED_OPTIONAL` | `request` |  |
| `new-optional-request-parameter` | optional request parameter added to endpoint | `PARAM_ADDED_OPTIONAL` | `request` |  |
| `new-optional-request-property` | optional property added to request | `PROPERTY_ADDED_OPTIONAL` | `request` |  |
| `optional-response-header-removed` | optional response header deleted | `RESPONSE_HEADER_REMOVED` | `response` | RESPONSE_HEADER_REMOVED B required, else W |
| `request-body-added-optional` | optional request body added | `REQUEST_BODY_ADDED_OPTIONAL` | `request` |  |
| `request-body-all-of-removed` | sub-schema deleted from allOf in request body | `PROPERTY_REMOVED`, `PROPERTY_BECAME_OPTIONAL`, `TYPE_WIDENED`, `CONSTRAINT_LOOSENED`, `ENUM_VALUE_ADDED` | `request` | PROPERTY_REMOVED B closed, else W, PROPERTY_BECAME_OPTIONAL C, TYPE_WIDENED C, CONSTRAINT_LOOSENED C, ENUM_VALUE_ADDED C |
| `request-body-any-of-added` | sub-schema added to anyOf in request body | `COMPOSITION_BRANCH_ADDED` | `request` |  |
| `request-body-became-nullable` | null added as a possible value in request body | `NULLABLE_ADDED` | `request` |  |
| `request-body-became-optional` | request body became optional | `REQUEST_BODY_BECAME_OPTIONAL` | `request` |  |
| `request-body-const-removed` | request body const value unset | `CONSTRAINT_LOOSENED` on `const` | `request` |  |
| `request-body-default-value-added` | request body default value set | `DEFAULT_CHANGED` on `default` | `request` | DEFAULT_CHANGED B |
| `request-body-default-value-changed` | request body default value modified | `DEFAULT_CHANGED` on `default` | `request` | DEFAULT_CHANGED B |
| `request-body-default-value-removed` | request body default value unset | `DEFAULT_CHANGED` on `default` | `request` | DEFAULT_CHANGED B |
| `request-body-exclusive-max-increased` | request body exclusiveMaximum increased | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `request` |  |
| `request-body-exclusive-max-unset` | request body exclusiveMaximum unset | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `request` |  |
| `request-body-exclusive-min-decreased` | request body exclusiveMinimum decreased | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `request` |  |
| `request-body-exclusive-min-unset` | request body exclusiveMinimum unset | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `request` |  |
| `request-body-list-of-types-widened` | request body list-of-types widened | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED` | `request` |  |
| `request-body-max-increased` | request body max increased | `CONSTRAINT_LOOSENED` on `maximum` | `request` |  |
| `request-body-max-items-increased` | request body max items increased | `CONSTRAINT_LOOSENED` on `maxItems` | `request` |  |
| `request-body-max-items-unset` | request body maxItems unset | `CONSTRAINT_LOOSENED` on `maxItems` | `request` |  |
| `request-body-max-length-increased` | request body max length increased | `CONSTRAINT_LOOSENED` on `maxLength` | `request` |  |
| `request-body-max-length-unset` | request body maxLength unset | `CONSTRAINT_LOOSENED` on `maxLength` | `request` |  |
| `request-body-max-properties-increased` | request body max properties increased | `CONSTRAINT_LOOSENED` on `maxProperties` | `request` |  |
| `request-body-max-properties-unset` | request body maxProperties unset | `CONSTRAINT_LOOSENED` on `maxProperties` | `request` |  |
| `request-body-max-unset` | request body max unset | `CONSTRAINT_LOOSENED` on `maximum` | `request` |  |
| `request-body-media-type-added` | request body media-type added | `REQUEST_MEDIA_TYPE_ADDED` | `request` |  |
| `request-body-media-type-schema-removed` | request body media-type schema removed | `SCHEMA_REMOVED` | `request` |  |
| `request-body-min-decreased` | request body min decreased | `CONSTRAINT_LOOSENED` on `minimum` | `request` |  |
| `request-body-min-items-decreased` | request body minItems decreased | `CONSTRAINT_LOOSENED` on `minItems` | `request` |  |
| `request-body-min-items-unset` | request body minItems unset | `CONSTRAINT_LOOSENED` on `minItems` | `request` |  |
| `request-body-min-length-decreased` | request body min length decreased | `CONSTRAINT_LOOSENED` on `minLength` | `request` |  |
| `request-body-min-length-unset` | request body minLength unset | `CONSTRAINT_LOOSENED` on `minLength` | `request` |  |
| `request-body-min-properties-decreased` | request body minProperties decreased | `CONSTRAINT_LOOSENED` on `minProperties` | `request` |  |
| `request-body-min-properties-unset` | request body minProperties unset | `CONSTRAINT_LOOSENED` on `minProperties` | `request` |  |
| `request-body-min-unset` | request body min unset | `CONSTRAINT_LOOSENED` on `minimum` | `request` |  |
| `request-body-multiple-of-generalized` | request body multipleOf generalized | `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` on `multipleOf` | `request` | CONSTRAINT_LOOSENED C, CONSTRAINT_CHANGED B |
| `request-body-multiple-of-unset` | request body multipleOf unset | `CONSTRAINT_LOOSENED` on `multipleOf` | `request` |  |
| `request-body-one-of-added` | sub-schema added to oneOf in request body | `COMPOSITION_BRANCH_ADDED`, `COMPOSITION_BRANCH_REMOVED` | `request` | COMPOSITION_BRANCH_ADDED C, COMPOSITION_BRANCH_REMOVED B |
| `request-body-type-compatible` | request body type changed but backward compatible | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_TIGHTENED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `request` | TYPE_WIDENED C, COMPOSITION_BRANCH_ADDED C, CONSTRAINT_TIGHTENED B, CONSTRAINT_LOOSENED C, CONSTRAINT_CHANGED B |
| `request-body-type-generalized` | request body type generalized | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `request` | TYPE_WIDENED C, COMPOSITION_BRANCH_ADDED C, CONSTRAINT_LOOSENED C, CONSTRAINT_CHANGED B |
| `request-body-unique-items-unset` | request body uniqueItems unset | `CONSTRAINT_LOOSENED` on `uniqueItems` | `request` |  |
| `request-optional-property-became-not-read-only` | request optional property became not read-only | `PROPERTY_ADDED_OPTIONAL` | `request` |  |
| `request-optional-property-became-read-only` | request optional property became read-only | `PROPERTY_REMOVED` | `request` | PROPERTY_REMOVED B closed, else W |
| `request-parameter-became-nullable` | request parameter became nullable | `NULLABLE_ADDED` | `request` |  |
| `request-parameter-became-optional` | request parameter became optional | `PARAM_BECAME_OPTIONAL` | `request` |  |
| `request-parameter-default-value-added` | request parameter default value set | `DEFAULT_CHANGED` on `default` | `request` | DEFAULT_CHANGED B |
| `request-parameter-default-value-changed` | request parameter default value changed | `DEFAULT_CHANGED` on `default` | `request` | DEFAULT_CHANGED B |
| `request-parameter-default-value-removed` | request parameter default value unset | `DEFAULT_CHANGED` on `default` | `request` | DEFAULT_CHANGED B |
| `request-parameter-deprecated` | request parameter deprecated | `DEPRECATION_ADDED` | `none` |  |
| `request-parameter-enum-value-added` | request parameter enum value added | `ENUM_VALUE_ADDED` | `request` |  |
| `request-parameter-exclusive-max-increased` | request parameter exclusiveMaximum increased | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `request` |  |
| `request-parameter-exclusive-max-unset` | request parameter exclusiveMaximum unset | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `request` |  |
| `request-parameter-exclusive-min-decreased` | request parameter exclusiveMinimum decreased | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `request` |  |
| `request-parameter-exclusive-min-unset` | request parameter exclusiveMinimum unset | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `request` |  |
| `request-parameter-list-of-types-widened` | request parameter list-of-types widened | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED` | `request` |  |
| `request-parameter-max-increased` | request parameter max increased | `CONSTRAINT_LOOSENED` on `maximum` | `request` |  |
| `request-parameter-max-items-increased` | request parameter max items increased | `CONSTRAINT_LOOSENED` on `maxItems` | `request` |  |
| `request-parameter-max-items-unset` | request parameter maxItems unset | `CONSTRAINT_LOOSENED` on `maxItems` | `request` |  |
| `request-parameter-max-length-increased` | request parameter max length increased | `CONSTRAINT_LOOSENED` on `maxLength` | `request` |  |
| `request-parameter-max-length-unset` | request parameter maxLength unset | `CONSTRAINT_LOOSENED` on `maxLength` | `request` |  |
| `request-parameter-max-properties-increased` | request parameter maxProperties increased | `CONSTRAINT_LOOSENED` on `maxProperties` | `request` |  |
| `request-parameter-max-properties-unset` | request parameter maxProperties unset | `CONSTRAINT_LOOSENED` on `maxProperties` | `request` |  |
| `request-parameter-max-unset` | request parameter max unset | `CONSTRAINT_LOOSENED` on `maximum` | `request` |  |
| `request-parameter-min-decreased` | request parameter min decreased | `CONSTRAINT_LOOSENED` on `minimum` | `request` |  |
| `request-parameter-min-items-decreased` | request parameter min items decreased | `CONSTRAINT_LOOSENED` on `minItems` | `request` |  |
| `request-parameter-min-items-unset` | request parameter minItems unset | `CONSTRAINT_LOOSENED` on `minItems` | `request` |  |
| `request-parameter-min-length-decreased` | request parameter min length decreased | `CONSTRAINT_LOOSENED` on `minLength` | `request` |  |
| `request-parameter-min-length-unset` | request parameter minLength unset | `CONSTRAINT_LOOSENED` on `minLength` | `request` |  |
| `request-parameter-min-properties-decreased` | request parameter minProperties decreased | `CONSTRAINT_LOOSENED` on `minProperties` | `request` |  |
| `request-parameter-min-properties-unset` | request parameter minProperties unset | `CONSTRAINT_LOOSENED` on `minProperties` | `request` |  |
| `request-parameter-min-unset` | request parameter min unset | `CONSTRAINT_LOOSENED` on `minimum` | `request` |  |
| `request-parameter-multiple-of-unset` | request parameter multipleOf unset | `CONSTRAINT_LOOSENED` on `multipleOf` | `request` |  |
| `request-parameter-pattern-removed` | request parameter pattern unset | `CONSTRAINT_LOOSENED` on `pattern` | `request` |  |
| `request-parameter-property-became-nullable` | request parameter property became nullable | `NULLABLE_ADDED` | `request` |  |
| `request-parameter-property-enum-value-added` | request parameter property enum value added | `ENUM_VALUE_ADDED` | `request` |  |
| `request-parameter-property-list-of-types-widened` | request parameter property list-of-types widened | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED` | `request` |  |
| `request-parameter-property-type-generalized` | request parameter property type generalized | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `request` | TYPE_WIDENED C, COMPOSITION_BRANCH_ADDED C, CONSTRAINT_LOOSENED C, CONSTRAINT_CHANGED B |
| `request-parameter-reactivated` | request parameter reactivated (deprecation set to false) | `DEPRECATION_REMOVED` | `none` |  |
| `request-parameter-removed-with-deprecation` | request parameter deleted after deprecation | `PARAM_REMOVED` | `request` | PARAM_REMOVED W |
| `request-parameter-type-generalized` | request parameter type generalized | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `request` | TYPE_WIDENED C, COMPOSITION_BRANCH_ADDED C, CONSTRAINT_LOOSENED C, CONSTRAINT_CHANGED B |
| `request-property-all-of-removed` | sub-schema deleted from allOf in request property | `PROPERTY_REMOVED`, `PROPERTY_BECAME_OPTIONAL`, `TYPE_WIDENED`, `CONSTRAINT_LOOSENED`, `ENUM_VALUE_ADDED` | `request` | PROPERTY_REMOVED B closed, else W, PROPERTY_BECAME_OPTIONAL C, TYPE_WIDENED C, CONSTRAINT_LOOSENED C, ENUM_VALUE_ADDED C |
| `request-property-any-of-added` | sub-schema added to anyOf in request property | `COMPOSITION_BRANCH_ADDED` | `request` |  |
| `request-property-became-nullable` | request property became nullable | `NULLABLE_ADDED` | `request` |  |
| `request-property-became-optional` | request property became optional | `PROPERTY_BECAME_OPTIONAL` | `request` |  |
| `request-property-const-removed` | request property const value unset | `CONSTRAINT_LOOSENED` on `const` | `request` |  |
| `request-property-default-value-added` | request property default value set | `DEFAULT_CHANGED` on `default` | `request` | DEFAULT_CHANGED B |
| `request-property-default-value-changed` | request property default value changed | `DEFAULT_CHANGED` on `default` | `request` | DEFAULT_CHANGED B |
| `request-property-default-value-removed` | request property default value unset | `DEFAULT_CHANGED` on `default` | `request` | DEFAULT_CHANGED B |
| `request-property-deprecated` | request property deprecated | `DEPRECATION_ADDED` | `none` |  |
| `request-property-deprecated-with-sunset` | request property deprecated with sunset date | `DEPRECATION_ADDED` | `none` |  |
| `request-property-enum-value-added` | request property enum value added | `ENUM_VALUE_ADDED` | `request` |  |
| `request-property-exclusive-max-increased` | request property exclusiveMaximum increased | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `request` |  |
| `request-property-exclusive-max-unset` | request property exclusiveMaximum unset | `CONSTRAINT_LOOSENED` on `exclusiveMaximum` | `request` |  |
| `request-property-exclusive-min-decreased` | request property exclusiveMinimum decreased | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `request` |  |
| `request-property-exclusive-min-unset` | request property exclusiveMinimum unset | `CONSTRAINT_LOOSENED` on `exclusiveMinimum` | `request` |  |
| `request-property-list-of-types-widened` | request property list-of-types widened | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED` | `request` |  |
| `request-property-max-increased` | request property max increased | `CONSTRAINT_LOOSENED` on `maximum` | `request` |  |
| `request-property-max-items-increased` | request property max items increased | `CONSTRAINT_LOOSENED` on `maxItems` | `request` |  |
| `request-property-max-items-unset` | request property maxItems unset | `CONSTRAINT_LOOSENED` on `maxItems` | `request` |  |
| `request-property-max-length-increased` | request property max length increased | `CONSTRAINT_LOOSENED` on `maxLength` | `request` |  |
| `request-property-max-length-unset` | request property maxLength unset | `CONSTRAINT_LOOSENED` on `maxLength` | `request` |  |
| `request-property-max-properties-increased` | request property max properties increased | `CONSTRAINT_LOOSENED` on `maxProperties` | `request` |  |
| `request-property-max-properties-unset` | request property maxProperties unset | `CONSTRAINT_LOOSENED` on `maxProperties` | `request` |  |
| `request-property-max-unset` | request property max unset | `CONSTRAINT_LOOSENED` on `maximum` | `request` |  |
| `request-property-min-decreased` | request property min decreased | `CONSTRAINT_LOOSENED` on `minimum` | `request` |  |
| `request-property-min-items-decreased` | request property minItems decreased | `CONSTRAINT_LOOSENED` on `minItems` | `request` |  |
| `request-property-min-items-unset` | request property minItems unset | `CONSTRAINT_LOOSENED` on `minItems` | `request` |  |
| `request-property-min-length-decreased` | request property min length decreased | `CONSTRAINT_LOOSENED` on `minLength` | `request` |  |
| `request-property-min-length-unset` | request property minLength unset | `CONSTRAINT_LOOSENED` on `minLength` | `request` |  |
| `request-property-min-properties-decreased` | request property minProperties decreased | `CONSTRAINT_LOOSENED` on `minProperties` | `request` |  |
| `request-property-min-properties-unset` | request property minProperties unset | `CONSTRAINT_LOOSENED` on `minProperties` | `request` |  |
| `request-property-min-unset` | request property min unset | `CONSTRAINT_LOOSENED` on `minimum` | `request` |  |
| `request-property-multiple-of-generalized` | request property multipleOf generalized | `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` on `multipleOf` | `request` | CONSTRAINT_LOOSENED C, CONSTRAINT_CHANGED B |
| `request-property-multiple-of-unset` | request property multipleOf unset | `CONSTRAINT_LOOSENED` on `multipleOf` | `request` |  |
| `request-property-one-of-added` | sub-schema added to oneOf in request property | `COMPOSITION_BRANCH_ADDED`, `COMPOSITION_BRANCH_REMOVED` | `request` | COMPOSITION_BRANCH_ADDED C, COMPOSITION_BRANCH_REMOVED B |
| `request-property-pattern-removed` | request property pattern unset | `CONSTRAINT_LOOSENED` on `pattern` | `request` |  |
| `request-property-reactivated` | request property reactivated (deprecation set to false) | `DEPRECATION_REMOVED` | `none` |  |
| `request-property-type-compatible` | request property type changed but backward compatible | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_TIGHTENED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `request` | TYPE_WIDENED C, COMPOSITION_BRANCH_ADDED C, CONSTRAINT_TIGHTENED B, CONSTRAINT_LOOSENED C, CONSTRAINT_CHANGED B |
| `request-property-type-generalized` | request property type generalized | `TYPE_WIDENED`, `COMPOSITION_BRANCH_ADDED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `request` | TYPE_WIDENED C, COMPOSITION_BRANCH_ADDED C, CONSTRAINT_LOOSENED C, CONSTRAINT_CHANGED B |
| `request-property-unique-items-unset` | request property uniqueItems unset | `CONSTRAINT_LOOSENED` on `uniqueItems` | `request` |  |
| `request-required-property-became-not-read-only` | request required property became not read-only | `PROPERTY_ADDED_REQUIRED` | `request` | PROPERTY_ADDED_REQUIRED B |
| `request-required-property-became-read-only` | request required property became read-only | `PROPERTY_REMOVED` | `request` | PROPERTY_REMOVED B closed, else W |
| `response-body-all-of-added` | sub-schema added to allOf in response body | `PROPERTY_ADDED_REQUIRED`, `PROPERTY_BECAME_REQUIRED`, `TYPE_NARROWED`, `CONSTRAINT_TIGHTENED`, `ENUM_VALUE_REMOVED` | `response` |  |
| `response-body-any-of-removed` | sub-schema removed from anyOf in response body | `COMPOSITION_BRANCH_REMOVED` | `response` |  |
| `response-body-became-not-nullable` | response body became not nullable | `NULLABLE_REMOVED` | `response` |  |
| `response-body-const-added` | response body const value set | `CONSTRAINT_TIGHTENED` on `const` | `response` |  |
| `response-body-default-value-added` | response body default value set | `DEFAULT_CHANGED` on `default` | `response` | DEFAULT_CHANGED W |
| `response-body-default-value-changed` | response body default value changed | `DEFAULT_CHANGED` on `default` | `response` | DEFAULT_CHANGED W |
| `response-body-default-value-removed` | response body default value unset | `DEFAULT_CHANGED` on `default` | `response` | DEFAULT_CHANGED W |
| `response-body-exclusive-max-decreased` | response body exclusiveMaximum decreased | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `response` |  |
| `response-body-exclusive-max-set` | response body exclusiveMaximum set | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `response` |  |
| `response-body-exclusive-min-increased` | response body exclusiveMinimum increased | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `response` |  |
| `response-body-exclusive-min-set` | response body exclusiveMinimum set | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `response` |  |
| `response-body-list-of-types-narrowed` | response body list-of-types narrowed | `TYPE_NARROWED`, `COMPOSITION_BRANCH_REMOVED` | `response` |  |
| `response-body-max-decreased` | response body max decreased | `CONSTRAINT_TIGHTENED` on `maximum` | `response` |  |
| `response-body-max-items-decreased` | response body maxItems decreased | `CONSTRAINT_TIGHTENED` on `maxItems` | `response` |  |
| `response-body-max-items-set` | response body maxItems set | `CONSTRAINT_TIGHTENED` on `maxItems` | `response` |  |
| `response-body-max-length-decreased` | response body maxLength decreased | `CONSTRAINT_TIGHTENED` on `maxLength` | `response` |  |
| `response-body-max-length-set` | response body maxLength set | `CONSTRAINT_TIGHTENED` on `maxLength` | `response` |  |
| `response-body-max-properties-decreased` | response body maxProperties decreased | `CONSTRAINT_TIGHTENED` on `maxProperties` | `response` |  |
| `response-body-max-properties-set` | response body maxProperties set | `CONSTRAINT_TIGHTENED` on `maxProperties` | `response` |  |
| `response-body-max-set` | response body max set | `CONSTRAINT_TIGHTENED` on `maximum` | `response` |  |
| `response-body-media-type-schema-added` | response media-type schema added | `SCHEMA_ADDED` | `response` |  |
| `response-body-min-increased` | response body min increased | `CONSTRAINT_TIGHTENED` on `minimum` | `response` |  |
| `response-body-min-items-increased` | response body minItems increased | `CONSTRAINT_TIGHTENED` on `minItems` | `response` |  |
| `response-body-min-items-set` | response body minItems set | `CONSTRAINT_TIGHTENED` on `minItems` | `response` |  |
| `response-body-min-length-increased` | response body minLength increased | `CONSTRAINT_TIGHTENED` on `minLength` | `response` |  |
| `response-body-min-length-set` | response body minLength set | `CONSTRAINT_TIGHTENED` on `minLength` | `response` |  |
| `response-body-min-properties-increased` | response body minProperties increased | `CONSTRAINT_TIGHTENED` on `minProperties` | `response` |  |
| `response-body-min-properties-set` | response body minProperties set | `CONSTRAINT_TIGHTENED` on `minProperties` | `response` |  |
| `response-body-min-set` | response body min set | `CONSTRAINT_TIGHTENED` on `minimum` | `response` |  |
| `response-body-multiple-of-set` | response body multipleOf set | `CONSTRAINT_TIGHTENED` on `multipleOf` | `response` |  |
| `response-body-multiple-of-specialized` | response body multipleOf specialized | `CONSTRAINT_TIGHTENED`, `CONSTRAINT_CHANGED` on `multipleOf` | `response` | CONSTRAINT_TIGHTENED C, CONSTRAINT_CHANGED B |
| `response-body-one-of-removed` | sub-schema removed from oneOf in response body | `COMPOSITION_BRANCH_REMOVED`, `COMPOSITION_BRANCH_ADDED` | `response` | COMPOSITION_BRANCH_REMOVED C, COMPOSITION_BRANCH_ADDED B |
| `response-body-type-compatible` | response body type changed but backward compatible | `TYPE_NARROWED`, `COMPOSITION_BRANCH_REMOVED`, `CONSTRAINT_TIGHTENED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `response` | TYPE_NARROWED C, COMPOSITION_BRANCH_REMOVED C, CONSTRAINT_TIGHTENED C, CONSTRAINT_LOOSENED B, CONSTRAINT_CHANGED B |
| `response-body-type-specialized` | response body type specialized | `TYPE_NARROWED`, `COMPOSITION_BRANCH_REMOVED`, `CONSTRAINT_TIGHTENED`, `CONSTRAINT_CHANGED` | `response` | TYPE_NARROWED C, COMPOSITION_BRANCH_REMOVED C, CONSTRAINT_TIGHTENED C, CONSTRAINT_CHANGED B |
| `response-header-added` | response header added | `RESPONSE_HEADER_ADDED` | `response` |  |
| `response-header-became-not-nullable` | response header became not nullable | `NULLABLE_REMOVED` | `response` |  |
| `response-header-exclusive-max-decreased` | response header exclusiveMaximum decreased | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `response` |  |
| `response-header-exclusive-max-set` | response header exclusiveMaximum set | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `response` |  |
| `response-header-exclusive-min-increased` | response header exclusiveMinimum increased | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `response` |  |
| `response-header-exclusive-min-set` | response header exclusiveMinimum set | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `response` |  |
| `response-header-max-decreased` | response header max decreased | `CONSTRAINT_TIGHTENED` on `maximum` | `response` |  |
| `response-header-max-items-decreased` | response header maxItems decreased | `CONSTRAINT_TIGHTENED` on `maxItems` | `response` |  |
| `response-header-max-items-set` | response header maxItems set | `CONSTRAINT_TIGHTENED` on `maxItems` | `response` |  |
| `response-header-max-length-decreased` | response header maxLength decreased | `CONSTRAINT_TIGHTENED` on `maxLength` | `response` |  |
| `response-header-max-length-set` | response header maxLength set | `CONSTRAINT_TIGHTENED` on `maxLength` | `response` |  |
| `response-header-max-properties-decreased` | response header maxProperties decreased | `CONSTRAINT_TIGHTENED` on `maxProperties` | `response` |  |
| `response-header-max-properties-set` | response header maxProperties set | `CONSTRAINT_TIGHTENED` on `maxProperties` | `response` |  |
| `response-header-max-set` | response header max set | `CONSTRAINT_TIGHTENED` on `maximum` | `response` |  |
| `response-header-min-increased` | response header min increased | `CONSTRAINT_TIGHTENED` on `minimum` | `response` |  |
| `response-header-min-items-increased` | response header minItems increased | `CONSTRAINT_TIGHTENED` on `minItems` | `response` |  |
| `response-header-min-items-set` | response header minItems set | `CONSTRAINT_TIGHTENED` on `minItems` | `response` |  |
| `response-header-min-length-increased` | response header minLength increased | `CONSTRAINT_TIGHTENED` on `minLength` | `response` |  |
| `response-header-min-length-set` | response header minLength set | `CONSTRAINT_TIGHTENED` on `minLength` | `response` |  |
| `response-header-min-properties-increased` | response header minProperties increased | `CONSTRAINT_TIGHTENED` on `minProperties` | `response` |  |
| `response-header-min-properties-set` | response header minProperties set | `CONSTRAINT_TIGHTENED` on `minProperties` | `response` |  |
| `response-header-min-set` | response header min set | `CONSTRAINT_TIGHTENED` on `minimum` | `response` |  |
| `response-header-multiple-of-set` | response header multipleOf set | `CONSTRAINT_TIGHTENED` on `multipleOf` | `response` |  |
| `response-header-type-compatible` | response header type changed but backward compatible | `TYPE_NARROWED`, `COMPOSITION_BRANCH_REMOVED`, `CONSTRAINT_TIGHTENED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `response` | TYPE_NARROWED C, COMPOSITION_BRANCH_REMOVED C, CONSTRAINT_TIGHTENED C, CONSTRAINT_LOOSENED B, CONSTRAINT_CHANGED B |
| `response-header-type-specialized` | response header type specialized | `TYPE_NARROWED`, `COMPOSITION_BRANCH_REMOVED`, `CONSTRAINT_TIGHTENED`, `CONSTRAINT_CHANGED` | `response` | TYPE_NARROWED C, COMPOSITION_BRANCH_REMOVED C, CONSTRAINT_TIGHTENED C, CONSTRAINT_CHANGED B |
| `response-media-type-added` | response media type added | `RESPONSE_MEDIA_TYPE_ADDED` | `response` |  |
| `response-media-type-name-specialized` | response media type changed to a more specific type | `RESPONSE_MEDIA_TYPE_REMOVED`, `RESPONSE_MEDIA_TYPE_ADDED` | `response` | RESPONSE_MEDIA_TYPE_REMOVED B, RESPONSE_MEDIA_TYPE_ADDED C |
| `response-mediatype-enum-value-removed` | response mediatype enum value removed | `ENUM_VALUE_REMOVED` | `response` |  |
| `response-non-success-status-added` | response non-success status added | `RESPONSE_STATUS_ADDED` | `response` |  |
| `response-non-success-status-removed` | response non-success status removed | `RESPONSE_STATUS_REMOVED` | `response` | RESPONSE_STATUS_REMOVED W |
| `response-optional-property-added` | response optional property added | `PROPERTY_ADDED_OPTIONAL` | `response` |  |
| `response-optional-property-became-not-write-only` | response optional property became not write-only | `PROPERTY_ADDED_OPTIONAL` | `response` |  |
| `response-optional-property-became-write-only` | response optional property became write-only | `PROPERTY_REMOVED` | `response` | PROPERTY_REMOVED B required, else W |
| `response-optional-property-removed` | response optional property removed | `PROPERTY_REMOVED` | `response` | PROPERTY_REMOVED B required, else W |
| `response-property-all-of-added` | sub-schema added to allOf in response property | `PROPERTY_ADDED_REQUIRED`, `PROPERTY_BECAME_REQUIRED`, `TYPE_NARROWED`, `CONSTRAINT_TIGHTENED`, `ENUM_VALUE_REMOVED` | `response` |  |
| `response-property-any-of-removed` | sub-schema removed from anyOf in response property | `COMPOSITION_BRANCH_REMOVED` | `response` |  |
| `response-property-became-not-nullable` | response property became not nullable | `NULLABLE_REMOVED` | `response` |  |
| `response-property-became-required` | response property became required | `PROPERTY_BECAME_REQUIRED` | `response` |  |
| `response-property-const-added` | response property const value set | `CONSTRAINT_TIGHTENED` on `const` | `response` |  |
| `response-property-default-value-added` | response property default value set | `DEFAULT_CHANGED` on `default` | `response` | DEFAULT_CHANGED W |
| `response-property-default-value-changed` | response property default value changed | `DEFAULT_CHANGED` on `default` | `response` | DEFAULT_CHANGED W |
| `response-property-default-value-removed` | response property default value unset | `DEFAULT_CHANGED` on `default` | `response` | DEFAULT_CHANGED W |
| `response-property-deprecated` | response property deprecated | `DEPRECATION_ADDED` | `none` |  |
| `response-property-deprecated-with-sunset` | response property deprecated with sunset date | `DEPRECATION_ADDED` | `none` |  |
| `response-property-enum-value-removed` | response property enum value removed | `ENUM_VALUE_REMOVED` | `response` |  |
| `response-property-exclusive-max-decreased` | response property exclusiveMaximum decreased | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `response` |  |
| `response-property-exclusive-max-set` | response property exclusiveMaximum set | `CONSTRAINT_TIGHTENED` on `exclusiveMaximum` | `response` |  |
| `response-property-exclusive-min-increased` | response property exclusiveMinimum increased | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `response` |  |
| `response-property-exclusive-min-set` | response property exclusiveMinimum set | `CONSTRAINT_TIGHTENED` on `exclusiveMinimum` | `response` |  |
| `response-property-list-of-types-narrowed` | response property list-of-types narrowed | `TYPE_NARROWED`, `COMPOSITION_BRANCH_REMOVED` | `response` |  |
| `response-property-max-decreased` | response property max decreased | `CONSTRAINT_TIGHTENED` on `maximum` | `response` |  |
| `response-property-max-items-decreased` | response property maxItems decreased | `CONSTRAINT_TIGHTENED` on `maxItems` | `response` |  |
| `response-property-max-items-set` | response property maxItems set | `CONSTRAINT_TIGHTENED` on `maxItems` | `response` |  |
| `response-property-max-length-decreased` | response property maxLength decreased | `CONSTRAINT_TIGHTENED` on `maxLength` | `response` |  |
| `response-property-max-length-set` | response property maxLength set | `CONSTRAINT_TIGHTENED` on `maxLength` | `response` |  |
| `response-property-max-properties-decreased` | response property maxProperties decreased | `CONSTRAINT_TIGHTENED` on `maxProperties` | `response` |  |
| `response-property-max-properties-set` | response property maxProperties set | `CONSTRAINT_TIGHTENED` on `maxProperties` | `response` |  |
| `response-property-max-set` | response property max set | `CONSTRAINT_TIGHTENED` on `maximum` | `response` |  |
| `response-property-min-increased` | response property min increased | `CONSTRAINT_TIGHTENED` on `minimum` | `response` |  |
| `response-property-min-items-increased` | response property minItems increased | `CONSTRAINT_TIGHTENED` on `minItems` | `response` |  |
| `response-property-min-items-set` | response property minItems set | `CONSTRAINT_TIGHTENED` on `minItems` | `response` |  |
| `response-property-min-length-increased` | response property minLength increased | `CONSTRAINT_TIGHTENED` on `minLength` | `response` |  |
| `response-property-min-length-set` | response property minLength set | `CONSTRAINT_TIGHTENED` on `minLength` | `response` |  |
| `response-property-min-properties-increased` | response property minProperties increased | `CONSTRAINT_TIGHTENED` on `minProperties` | `response` |  |
| `response-property-min-properties-set` | response property minProperties set | `CONSTRAINT_TIGHTENED` on `minProperties` | `response` |  |
| `response-property-min-set` | response property min set | `CONSTRAINT_TIGHTENED` on `minimum` | `response` |  |
| `response-property-multiple-of-set` | response property multipleOf set | `CONSTRAINT_TIGHTENED` on `multipleOf` | `response` |  |
| `response-property-multiple-of-specialized` | response property multipleOf specialized | `CONSTRAINT_TIGHTENED`, `CONSTRAINT_CHANGED` on `multipleOf` | `response` | CONSTRAINT_TIGHTENED C, CONSTRAINT_CHANGED B |
| `response-property-one-of-removed` | sub-schema removed from oneOf in response property | `COMPOSITION_BRANCH_REMOVED`, `COMPOSITION_BRANCH_ADDED` | `response` | COMPOSITION_BRANCH_REMOVED C, COMPOSITION_BRANCH_ADDED B |
| `response-property-pattern-added` | response property pattern set | `CONSTRAINT_TIGHTENED` on `pattern` | `response` |  |
| `response-property-reactivated` | response property reactivated (deprecation set to false) | `DEPRECATION_REMOVED` | `none` |  |
| `response-property-type-compatible` | response property type changed but backward compatible | `TYPE_NARROWED`, `COMPOSITION_BRANCH_REMOVED`, `CONSTRAINT_TIGHTENED`, `CONSTRAINT_LOOSENED`, `CONSTRAINT_CHANGED` | `response` | TYPE_NARROWED C, COMPOSITION_BRANCH_REMOVED C, CONSTRAINT_TIGHTENED C, CONSTRAINT_LOOSENED B, CONSTRAINT_CHANGED B |
| `response-property-type-specialized` | response property type specialized | `TYPE_NARROWED`, `COMPOSITION_BRANCH_REMOVED`, `CONSTRAINT_TIGHTENED`, `CONSTRAINT_CHANGED` | `response` | TYPE_NARROWED C, COMPOSITION_BRANCH_REMOVED C, CONSTRAINT_TIGHTENED C, CONSTRAINT_CHANGED B |
| `response-required-property-added` | response required property added | `PROPERTY_ADDED_REQUIRED` | `response` |  |
| `response-required-property-became-not-write-only` | response required property became not write-only | `PROPERTY_ADDED_REQUIRED` | `response` |  |
| `response-required-property-became-write-only` | response required property became write-only | `PROPERTY_REMOVED` | `response` | PROPERTY_REMOVED B required, else W |
| `response-success-status-added` | response success status added | `RESPONSE_STATUS_ADDED` | `response` |  |
| `webhook-added` | webhook added | `OPERATION_ADDED` | `none` |  |

## notEvaluated

212 checks.

### notEvaluated — oasdiff error

| Check | oasdiff description | Code |
|---|---|---|
| `request-body-contains-added` | contains constraint added to request body | `KEYWORD` |
| `request-body-content-encoding-changed` | request body contentEncoding changed | `KEYWORD` |
| `request-body-content-media-type-changed` | request body contentMediaType changed | `KEYWORD` |
| `request-body-content-schema-added` | contentSchema added to request body | `KEYWORD` |
| `request-body-dependent-required-added` | request body dependentRequired added | `KEYWORD` |
| `request-body-dependent-required-changed` | request body dependentRequired changed | `KEYWORD` |
| `request-body-dependent-schema-added` | dependent schema added to request body | `KEYWORD` |
| `request-body-else-added` | else subschema added to request body | `KEYWORD` |
| `request-body-if-added` | if subschema added to request body | `KEYWORD` |
| `request-body-max-contains-decreased` | request body maxContains decreased | `KEYWORD` |
| `request-body-max-contains-set` | request body maxContains set | `KEYWORD` |
| `request-body-media-type-item-schema-added` | request body media-type item schema added | `OAS_VERSION` |
| `request-body-min-contains-increased` | request body minContains increased | `KEYWORD` |
| `request-body-min-contains-set` | request body minContains set | `KEYWORD` |
| `request-body-pattern-property-added` | pattern property added to request body | `KEYWORD` |
| `request-body-property-names-added` | propertyNames constraint added to request body | `KEYWORD` |
| `request-body-schema-became-false` | request body schema became the boolean `false` | `FALSE_SCHEMA` |
| `request-body-then-added` | then subschema added to request body | `KEYWORD` |
| `request-body-unevaluated-items-added` | unevaluatedItems constraint added to request body | `KEYWORD` |
| `request-body-unevaluated-properties-added` | unevaluatedProperties constraint added to request body | `KEYWORD` |
| `request-parameter-max-contains-decreased` | request parameter maxContains decreased | `KEYWORD` |
| `request-parameter-max-contains-set` | request parameter maxContains set | `KEYWORD` |
| `request-parameter-min-contains-increased` | request parameter minContains increased | `KEYWORD` |
| `request-parameter-min-contains-set` | request parameter minContains set | `KEYWORD` |
| `request-parameter-property-schema-became-false` | request parameter property schema became the boolean `false` | `FALSE_SCHEMA` |
| `request-parameter-schema-became-false` | request parameter schema became the boolean `false` | `FALSE_SCHEMA` |
| `request-property-contains-added` | contains constraint added to request property | `KEYWORD` |
| `request-property-content-encoding-changed` | request property contentEncoding changed | `KEYWORD` |
| `request-property-content-media-type-changed` | request property contentMediaType changed | `KEYWORD` |
| `request-property-content-schema-added` | contentSchema added to request property | `KEYWORD` |
| `request-property-dependent-required-added` | request property dependentRequired added | `KEYWORD` |
| `request-property-dependent-required-changed` | request property dependentRequired changed | `KEYWORD` |
| `request-property-dependent-schema-added` | dependent schema added to request property | `KEYWORD` |
| `request-property-else-added` | else subschema added to request property | `KEYWORD` |
| `request-property-if-added` | if subschema added to request property | `KEYWORD` |
| `request-property-max-contains-decreased` | request property maxContains decreased | `KEYWORD` |
| `request-property-max-contains-set` | request property maxContains set | `KEYWORD` |
| `request-property-min-contains-increased` | request property minContains increased | `KEYWORD` |
| `request-property-min-contains-set` | request property minContains set | `KEYWORD` |
| `request-property-pattern-property-added` | pattern property added to request property | `KEYWORD` |
| `request-property-property-names-added` | propertyNames constraint added to request property | `KEYWORD` |
| `request-property-schema-became-false` | request property schema became the boolean `false` | `FALSE_SCHEMA` |
| `request-property-then-added` | then subschema added to request property | `KEYWORD` |
| `request-property-unevaluated-items-added` | unevaluatedItems constraint added to request property | `KEYWORD` |
| `request-property-unevaluated-properties-added` | unevaluatedProperties constraint added to request property | `KEYWORD` |
| `response-body-contains-removed` | contains constraint removed from response body | `KEYWORD` |
| `response-body-content-encoding-changed` | response body contentEncoding changed | `KEYWORD` |
| `response-body-content-media-type-changed` | response body contentMediaType changed | `KEYWORD` |
| `response-body-content-schema-removed` | contentSchema removed from response body | `KEYWORD` |
| `response-body-dependent-required-changed` | response body dependentRequired changed | `KEYWORD` |
| `response-body-dependent-required-removed` | response body dependentRequired removed | `KEYWORD` |
| `response-body-dependent-schema-removed` | dependent schema removed from response body | `KEYWORD` |
| `response-body-else-removed` | else subschema removed from response body | `KEYWORD` |
| `response-body-if-removed` | if subschema removed from response body | `KEYWORD` |
| `response-body-max-contains-increased` | response body maxContains increased | `KEYWORD` |
| `response-body-max-contains-unset` | response body maxContains unset | `KEYWORD` |
| `response-body-media-type-item-schema-removed` | response media-type item schema removed | `OAS_VERSION` |
| `response-body-media-type-item-schema-removed-untyped` | response media-type item schema removed, leaving the body untyped | `OAS_VERSION` |
| `response-body-min-contains-decreased` | response body minContains decreased | `KEYWORD` |
| `response-body-min-contains-unset` | response body minContains unset | `KEYWORD` |
| `response-body-pattern-property-removed` | pattern property removed from response body | `KEYWORD` |
| `response-body-property-names-removed` | propertyNames constraint removed from response body | `KEYWORD` |
| `response-body-schema-became-false` | response body schema became the boolean `false` | `FALSE_SCHEMA` |
| `response-body-then-removed` | then subschema removed from response body | `KEYWORD` |
| `response-body-unevaluated-items-removed` | unevaluatedItems constraint removed from response body | `KEYWORD` |
| `response-body-unevaluated-properties-removed` | unevaluatedProperties constraint removed from response body | `KEYWORD` |
| `response-header-max-contains-increased` | response header maxContains increased | `KEYWORD` |
| `response-header-max-contains-unset` | response header maxContains unset | `KEYWORD` |
| `response-header-min-contains-decreased` | response header minContains decreased | `KEYWORD` |
| `response-header-min-contains-unset` | response header minContains unset | `KEYWORD` |
| `response-header-schema-became-not-false` | response header schema is no longer the boolean `false` | `FALSE_SCHEMA` |
| `response-media-type-parameter-changed` | response media type parameter value changed | `MEDIA_TYPE_PARAMS` |
| `response-media-type-parameter-removed` | response media type parameter removed | `MEDIA_TYPE_PARAMS` |
| `response-property-contains-removed` | contains constraint removed from response property | `KEYWORD` |
| `response-property-content-encoding-changed` | response property contentEncoding changed | `KEYWORD` |
| `response-property-content-media-type-changed` | response property contentMediaType changed | `KEYWORD` |
| `response-property-content-schema-removed` | contentSchema removed from response property | `KEYWORD` |
| `response-property-dependent-required-changed` | response property dependentRequired changed | `KEYWORD` |
| `response-property-dependent-required-removed` | response property dependentRequired removed | `KEYWORD` |
| `response-property-dependent-schema-removed` | dependent schema removed from response property | `KEYWORD` |
| `response-property-else-removed` | else subschema removed from response property | `KEYWORD` |
| `response-property-if-removed` | if subschema removed from response property | `KEYWORD` |
| `response-property-max-contains-increased` | response property maxContains increased | `KEYWORD` |
| `response-property-max-contains-unset` | response property maxContains unset | `KEYWORD` |
| `response-property-min-contains-decreased` | response property minContains decreased | `KEYWORD` |
| `response-property-min-contains-unset` | response property minContains unset | `KEYWORD` |
| `response-property-pattern-property-removed` | pattern property removed from response property | `KEYWORD` |
| `response-property-property-names-removed` | propertyNames constraint removed from response property | `KEYWORD` |
| `response-property-schema-became-not-false` | response property schema is no longer the boolean `false` | `FALSE_SCHEMA` |
| `response-property-then-removed` | then subschema removed from response property | `KEYWORD` |
| `response-property-unevaluated-items-removed` | unevaluatedItems constraint removed from response property | `KEYWORD` |
| `response-property-unevaluated-properties-removed` | unevaluatedProperties constraint removed from response property | `KEYWORD` |

### notEvaluated — oasdiff warning

| Check | oasdiff description | Code |
|---|---|---|
| `request-body-prefix-items-added` | sub-schema added to prefixItems in request body | `KEYWORD` |
| `request-body-prefix-items-removed` | sub-schema removed from prefixItems in request body | `KEYWORD` |
| `request-property-prefix-items-added` | sub-schema added to prefixItems in request property | `KEYWORD` |
| `request-property-prefix-items-removed` | sub-schema removed from prefixItems in request property | `KEYWORD` |
| `response-body-prefix-items-added` | sub-schema added to prefixItems in response body | `KEYWORD` |
| `response-body-prefix-items-removed` | sub-schema removed from prefixItems in response body | `KEYWORD` |
| `response-property-prefix-items-added` | sub-schema added to prefixItems in response property | `KEYWORD` |
| `response-property-prefix-items-removed` | sub-schema removed from prefixItems in response property | `KEYWORD` |

### notEvaluated — oasdiff info

| Check | oasdiff description | Code |
|---|---|---|
| `api-security-component-added` | security scheme added in components/securitySchemes | `SECURITY_SCHEME` |
| `api-security-component-oauth-scope-added` | scope added to OAuth flow in components/securitySchemes | `SECURITY_SCHEME` |
| `api-security-component-oauth-scope-changed` | scope modified in OAuth flow in components/securitySchemes | `SECURITY_SCHEME` |
| `api-security-component-oauth-scope-removed` | scope deleted from OAuth flow in components/securitySchemes | `SECURITY_SCHEME` |
| `api-security-component-oauth-token-url-changed` | token URL modified in OAuth flow in components/securitySchemes | `SECURITY_SCHEME` |
| `api-security-component-oauth-url-changed` | auth URL modified in OAuth flow in components/securitySchemes | `SECURITY_SCHEME` |
| `api-security-component-removed` | security scheme deleted in components/securitySchemes | `SECURITY_SCHEME` |
| `api-security-component-type-changed` | security scheme type modified in components/securitySchemes | `SECURITY_SCHEME` |
| `request-body-contains-removed` | contains constraint removed from request body | `KEYWORD` |
| `request-body-content-schema-removed` | contentSchema removed from request body | `KEYWORD` |
| `request-body-dependent-required-removed` | request body dependentRequired removed | `KEYWORD` |
| `request-body-dependent-schema-removed` | dependent schema removed from request body | `KEYWORD` |
| `request-body-discriminator-added` | request body discriminator added | `DISCRIMINATOR` |
| `request-body-discriminator-mapping-added` | request body discriminator mapping added | `DISCRIMINATOR` |
| `request-body-discriminator-mapping-changed` | request body discriminator mapping changed | `DISCRIMINATOR` |
| `request-body-discriminator-mapping-deleted` | request body discriminator mapping deleted | `DISCRIMINATOR` |
| `request-body-discriminator-property-name-changed` | request body discriminator property name changed | `DISCRIMINATOR` |
| `request-body-discriminator-removed` | request body discriminator deleted | `DISCRIMINATOR` |
| `request-body-else-removed` | else subschema removed from request body | `KEYWORD` |
| `request-body-if-removed` | if subschema removed from request body | `KEYWORD` |
| `request-body-max-contains-increased` | request body maxContains increased | `KEYWORD` |
| `request-body-max-contains-unset` | request body maxContains unset | `KEYWORD` |
| `request-body-media-type-item-schema-removed` | request body media-type item schema removed | `OAS_VERSION` |
| `request-body-min-contains-decreased` | request body minContains decreased | `KEYWORD` |
| `request-body-min-contains-unset` | request body minContains unset | `KEYWORD` |
| `request-body-pattern-property-removed` | pattern property removed from request body | `KEYWORD` |
| `request-body-property-names-removed` | propertyNames constraint removed from request body | `KEYWORD` |
| `request-body-schema-became-not-false` | request body schema is no longer the boolean `false` | `FALSE_SCHEMA` |
| `request-body-then-removed` | then subschema removed from request body | `KEYWORD` |
| `request-body-unevaluated-items-removed` | unevaluatedItems constraint removed from request body | `KEYWORD` |
| `request-body-unevaluated-properties-removed` | unevaluatedProperties constraint removed from request body | `KEYWORD` |
| `request-parameter-max-contains-increased` | request parameter maxContains increased | `KEYWORD` |
| `request-parameter-max-contains-unset` | request parameter maxContains unset | `KEYWORD` |
| `request-parameter-min-contains-decreased` | request parameter minContains decreased | `KEYWORD` |
| `request-parameter-min-contains-unset` | request parameter minContains unset | `KEYWORD` |
| `request-parameter-pattern-generalized` | request parameter pattern generalized | `NO_WITNESS` |
| `request-parameter-property-schema-became-not-false` | request parameter property schema is no longer the boolean `false` | `FALSE_SCHEMA` |
| `request-parameter-schema-became-not-false` | request parameter schema is no longer the boolean `false` | `FALSE_SCHEMA` |
| `request-property-contains-removed` | contains constraint removed from request property | `KEYWORD` |
| `request-property-content-schema-removed` | contentSchema removed from request property | `KEYWORD` |
| `request-property-dependent-required-removed` | request property dependentRequired removed | `KEYWORD` |
| `request-property-dependent-schema-removed` | dependent schema removed from request property | `KEYWORD` |
| `request-property-discriminator-added` | request property discriminator added | `DISCRIMINATOR` |
| `request-property-discriminator-mapping-added` | request property discriminator mapping added | `DISCRIMINATOR` |
| `request-property-discriminator-mapping-changed` | request property discriminator mapping changed | `DISCRIMINATOR` |
| `request-property-discriminator-mapping-deleted` | request property discriminator mapping deleted | `DISCRIMINATOR` |
| `request-property-discriminator-property-name-changed` | request property discriminator property name changed | `DISCRIMINATOR` |
| `request-property-discriminator-removed` | request property discriminator removed | `DISCRIMINATOR` |
| `request-property-else-removed` | else subschema removed from request property | `KEYWORD` |
| `request-property-if-removed` | if subschema removed from request property | `KEYWORD` |
| `request-property-max-contains-increased` | request property maxContains increased | `KEYWORD` |
| `request-property-max-contains-unset` | request property maxContains unset | `KEYWORD` |
| `request-property-min-contains-decreased` | request property minContains decreased | `KEYWORD` |
| `request-property-min-contains-unset` | request property minContains unset | `KEYWORD` |
| `request-property-pattern-generalized` | request property pattern generalized | `NO_WITNESS` |
| `request-property-pattern-property-removed` | pattern property removed from request property | `KEYWORD` |
| `request-property-property-names-removed` | propertyNames constraint removed from request property | `KEYWORD` |
| `request-property-schema-became-not-false` | request property schema is no longer the boolean `false` | `FALSE_SCHEMA` |
| `request-property-then-removed` | then subschema removed from request property | `KEYWORD` |
| `request-property-unevaluated-items-removed` | unevaluatedItems constraint removed from request property | `KEYWORD` |
| `request-property-unevaluated-properties-removed` | unevaluatedProperties constraint removed from request property | `KEYWORD` |
| `response-body-contains-added` | contains constraint added to response body | `KEYWORD` |
| `response-body-content-schema-added` | contentSchema added to response body | `KEYWORD` |
| `response-body-dependent-required-added` | response body dependentRequired added | `KEYWORD` |
| `response-body-dependent-schema-added` | dependent schema added to response body | `KEYWORD` |
| `response-body-discriminator-added` | response body discriminator added | `DISCRIMINATOR` |
| `response-body-discriminator-mapping-added` | response body discriminator mapping added | `DISCRIMINATOR` |
| `response-body-discriminator-mapping-changed` | response body discriminator mapping changed | `DISCRIMINATOR` |
| `response-body-discriminator-mapping-deleted` | response body discriminator mapping deleted | `DISCRIMINATOR` |
| `response-body-discriminator-property-name-changed` | response body discriminator property name changed | `DISCRIMINATOR` |
| `response-body-discriminator-removed` | response body discriminator removed | `DISCRIMINATOR` |
| `response-body-else-added` | else subschema added to response body | `KEYWORD` |
| `response-body-if-added` | if subschema added to response body | `KEYWORD` |
| `response-body-max-contains-decreased` | response body maxContains decreased | `KEYWORD` |
| `response-body-max-contains-set` | response body maxContains set | `KEYWORD` |
| `response-body-media-type-item-schema-added` | response media-type item schema added | `OAS_VERSION` |
| `response-body-min-contains-increased` | response body minContains increased | `KEYWORD` |
| `response-body-min-contains-set` | response body minContains set | `KEYWORD` |
| `response-body-pattern-property-added` | pattern property added to response body | `KEYWORD` |
| `response-body-property-names-added` | propertyNames constraint added to response body | `KEYWORD` |
| `response-body-schema-became-not-false` | response body schema is no longer the boolean `false` | `FALSE_SCHEMA` |
| `response-body-then-added` | then subschema added to response body | `KEYWORD` |
| `response-body-unevaluated-items-added` | unevaluatedItems constraint added to response body | `KEYWORD` |
| `response-body-unevaluated-properties-added` | unevaluatedProperties constraint added to response body | `KEYWORD` |
| `response-header-max-contains-decreased` | response header maxContains decreased | `KEYWORD` |
| `response-header-max-contains-set` | response header maxContains set | `KEYWORD` |
| `response-header-min-contains-increased` | response header minContains increased | `KEYWORD` |
| `response-header-min-contains-set` | response header minContains set | `KEYWORD` |
| `response-header-schema-became-false` | response header schema became the boolean `false` | `FALSE_SCHEMA` |
| `response-media-type-parameter-added` | response media type parameter added | `MEDIA_TYPE_PARAMS` |
| `response-property-contains-added` | contains constraint added to response property | `KEYWORD` |
| `response-property-content-schema-added` | contentSchema added to response property | `KEYWORD` |
| `response-property-dependent-required-added` | response property dependentRequired added | `KEYWORD` |
| `response-property-dependent-schema-added` | dependent schema added to response property | `KEYWORD` |
| `response-property-discriminator-added` | response property discriminator added | `DISCRIMINATOR` |
| `response-property-discriminator-mapping-added` | response property discriminator mapping added | `DISCRIMINATOR` |
| `response-property-discriminator-mapping-changed` | response property discriminator mapping changed | `DISCRIMINATOR` |
| `response-property-discriminator-mapping-deleted` | response property discriminator mapping deleted | `DISCRIMINATOR` |
| `response-property-discriminator-property-name-changed` | response property discriminator property name changed | `DISCRIMINATOR` |
| `response-property-discriminator-removed` | response property discriminator removed | `DISCRIMINATOR` |
| `response-property-else-added` | else subschema added to response property | `KEYWORD` |
| `response-property-if-added` | if subschema added to response property | `KEYWORD` |
| `response-property-max-contains-decreased` | response property maxContains decreased | `KEYWORD` |
| `response-property-max-contains-set` | response property maxContains set | `KEYWORD` |
| `response-property-min-contains-increased` | response property minContains increased | `KEYWORD` |
| `response-property-min-contains-set` | response property minContains set | `KEYWORD` |
| `response-property-pattern-property-added` | pattern property added to response property | `KEYWORD` |
| `response-property-property-names-added` | propertyNames constraint added to response property | `KEYWORD` |
| `response-property-schema-became-false` | response property schema became the boolean `false` | `FALSE_SCHEMA` |
| `response-property-then-added` | then subschema added to response property | `KEYWORD` |
| `response-property-unevaluated-items-added` | unevaluatedItems constraint added to response property | `KEYWORD` |
| `response-property-unevaluated-properties-added` | unevaluatedProperties constraint added to response property | `KEYWORD` |

## declined

55 checks.

### declined — oasdiff error

| Check | oasdiff description | Reason |
|---|---|---|
| `api-invalid-stability-level` | invalid stability level | Out of scope: x-stability-level is an x-* outside the three it reads (`x-extensible-enum`, `x-sunset`, `x-successor`) |
| `api-stability-decreased` | endpoint stability level decreased | Out of scope: x-stability-level is an x-* outside the three it reads (`x-extensible-enum`, `x-sunset`, `x-successor`) |
| `new-request-path-parameter` | new request path parameter | Out of scope: a path parameter is its template position; a declaration added for an unchanged template is no contract change, a changed template is a different operation |
| `request-parameter-sunset-date-changed-too-small` | request parameter sunset date moved below min required deprecation days | Out of scope: x-sunset is read on the operation only |
| `request-parameter-sunset-date-too-small` | deprecated request parameter sunset before min required deprecation days | Out of scope: x-sunset is read on the operation only |
| `request-parameter-sunset-deleted` | request parameter sunset date deleted while still deprecated | Out of scope: x-sunset is read on the operation only |
| `request-parameter-sunset-parse` | request parameter deprecated with invalid sunset date | Out of scope: x-sunset is read on the operation only |
| `request-parameter-x-extensible-enum-value-removed` | request parameter x-extensible-enum value deleted | Level: EXTENSIBLE_ENUM_REMOVED is – (no finding) request-side, W response-side — not proven breaking |
| `request-property-deprecated-sunset-invalid` | request property deprecated with invalid sunset date | Out of scope: x-sunset is read on the operation only |
| `request-property-stability-decreased` | request property stability level decreased | Out of scope: x-stability-level is an x-* outside the three it reads (`x-extensible-enum`, `x-sunset`, `x-successor`) |
| `request-property-sunset-date-too-small` | deprecated request property sunset before min required deprecation days | Out of scope: x-sunset is read on the operation only |
| `request-property-x-extensible-enum-value-removed` | request property x-extensible-enum value removed | Level: EXTENSIBLE_ENUM_REMOVED is – (no finding) request-side, W response-side — not proven breaking |
| `response-property-deprecated-sunset-invalid` | response property deprecated with invalid sunset date | Out of scope: x-sunset is read on the operation only |
| `response-property-stability-decreased` | response property stability level decreased | Out of scope: x-stability-level is an x-* outside the three it reads (`x-extensible-enum`, `x-sunset`, `x-successor`) |
| `response-property-sunset-date-too-small` | deprecated response property sunset before min required deprecation days | Out of scope: x-sunset is read on the operation only |

### declined — oasdiff info

| Check | oasdiff description | Reason |
|---|---|---|
| `api-major-version-not-bumped` | a breaking change was detected but the major version did not increase | Out of scope: info is not compared; a version-bump policy is a gate over the result, not a diff |
| `api-schema-removed` | schema deleted from components/schemas | Out of scope: a component is judged at each usage; an unreferenced component changes no operation |
| `api-stability-increased` | endpoint stability level increased | Out of scope: x-stability-level is an x-* outside the three it reads (`x-extensible-enum`, `x-sunset`, `x-successor`) |
| `api-tag-added` | endpoint tag added | Out of scope: tags are not compared |
| `api-tag-removed` | endpoint tag deleted | Out of scope: tags are not compared |
| `api-version-decreased` | a breaking change was detected but the version decreased | Out of scope: info is not compared; a version-bump policy is a gate over the result, not a diff |
| `api-version-not-bumped` | a breaking change was detected but the version was not bumped | Out of scope: info is not compared; a version-bump policy is a gate over the result, not a diff |
| `request-body-all-of-added-annotation-only` | annotation-only sub-schema added to allOf in request body (no wire-contract effect) | Compared, no change: the safe allOf flatten merges an annotation-only branch to the same contract |
| `request-body-all-of-removed-annotation-only` | annotation-only sub-schema removed from allOf in request body (no wire-contract effect) | Compared, no change: the safe allOf flatten merges an annotation-only branch to the same contract |
| `request-optional-property-became-not-write-only` | request optional property became not write-only | Projected away: writeOnly is dropped from the response tree only, so the request tree is unchanged |
| `request-optional-property-became-write-only` | request optional property became write-only | Projected away: writeOnly is dropped from the response tree only, so the request tree is unchanged |
| `request-property-all-of-added-annotation-only` | annotation-only sub-schema added to allOf in request property (no wire-contract effect) | Compared, no change: the safe allOf flatten merges an annotation-only branch to the same contract |
| `request-property-all-of-removed-annotation-only` | annotation-only sub-schema removed from allOf in request property (no wire-contract effect) | Compared, no change: the safe allOf flatten merges an annotation-only branch to the same contract |
| `request-property-stability-increased` | request property stability level increased | Out of scope: x-stability-level is an x-* outside the three it reads (`x-extensible-enum`, `x-sunset`, `x-successor`) |
| `request-read-only-property-enum-value-removed` | request read-only property enum value removed | Projected away: readOnly properties are dropped from the request tree |
| `request-read-only-property-exclusive-max-decreased` | request read-only property exclusiveMaximum decreased | Projected away: readOnly properties are dropped from the request tree |
| `request-read-only-property-exclusive-min-increased` | request read-only property exclusiveMinimum increased | Projected away: readOnly properties are dropped from the request tree |
| `request-read-only-property-max-decreased` | request read-only property max decreased | Projected away: readOnly properties are dropped from the request tree |
| `request-read-only-property-max-items-decreased` | request read-only property max items decreased | Projected away: readOnly properties are dropped from the request tree |
| `request-read-only-property-max-length-decreased` | request read-only property max length decreased | Projected away: readOnly properties are dropped from the request tree |
| `request-read-only-property-max-properties-decreased` | request read-only property max properties decreased | Projected away: readOnly properties are dropped from the request tree |
| `request-read-only-property-min-increased` | request read-only property min increased | Projected away: readOnly properties are dropped from the request tree |
| `request-required-property-became-not-write-only` | request required property became not write-only | Projected away: writeOnly is dropped from the response tree only, so the request tree is unchanged |
| `request-required-property-became-write-only` | request required property became write-only | Projected away: writeOnly is dropped from the response tree only, so the request tree is unchanged |
| `response-body-all-of-added-annotation-only` | annotation-only sub-schema added to allOf in response body (no wire-contract effect) | Compared, no change: the safe allOf flatten merges an annotation-only branch to the same contract |
| `response-body-all-of-removed-annotation-only` | annotation-only sub-schema removed from allOf in response body (no wire-contract effect) | Compared, no change: the safe allOf flatten merges an annotation-only branch to the same contract |
| `response-optional-property-became-not-read-only` | response optional property became not read-only | Projected away: readOnly is dropped from the request tree only, so the response tree is unchanged |
| `response-optional-property-became-read-only` | response optional property became read-only | Projected away: readOnly is dropped from the request tree only, so the response tree is unchanged |
| `response-optional-write-only-property-added` | response optional write-only property added | Projected away: writeOnly properties are dropped from the response tree |
| `response-optional-write-only-property-removed` | response optional write-only property removed | Projected away: writeOnly properties are dropped from the response tree |
| `response-property-all-of-added-annotation-only` | annotation-only sub-schema added to allOf in response property (no wire-contract effect) | Compared, no change: the safe allOf flatten merges an annotation-only branch to the same contract |
| `response-property-all-of-removed-annotation-only` | annotation-only sub-schema removed from allOf in response property (no wire-contract effect) | Compared, no change: the safe allOf flatten merges an annotation-only branch to the same contract |
| `response-property-stability-increased` | response property stability level increased | Out of scope: x-stability-level is an x-* outside the three it reads (`x-extensible-enum`, `x-sunset`, `x-successor`) |
| `response-required-property-became-not-read-only` | response required property became not read-only | Projected away: readOnly is dropped from the request tree only, so the response tree is unchanged |
| `response-required-property-became-read-only` | response required property became read-only | Projected away: readOnly is dropped from the request tree only, so the response tree is unchanged |
| `response-required-write-only-property-added` | response required write-only property added | Projected away: writeOnly properties are dropped from the response tree |
| `response-required-write-only-property-removed` | response required write-only property removed | Projected away: writeOnly properties are dropped from the response tree |
| `response-write-only-property-became-optional` | response write-only property became optional | Projected away: writeOnly properties are dropped from the response tree |
| `response-write-only-property-became-required` | response write-only property became required | Projected away: writeOnly properties are dropped from the response tree |
| `response-write-only-property-enum-value-added` | response write-only property enum value added | Projected away: writeOnly properties are dropped from the response tree |

