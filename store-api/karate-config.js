function fn() {
  // store-api is the bare-spec starter (the scaffold + gap-closing beats). Http.mock('openapi.yaml')
  // or Openapi.scaffold('openapi.yaml') stand up a backend at this baseUrl; override with -DbaseUrl=...
  var baseUrl = karate.properties['baseUrl'] || 'http://localhost:8080';
  return { baseUrl: baseUrl };
}
