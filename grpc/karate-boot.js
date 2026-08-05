// Activates the gRPC support and sets the endpoint once, for the whole suite. Every
// karate.channel('grpc') session starts from these defaults; a session can still override any of them.
var grpc = boot.ext('grpc');
grpc.host = boot.sysprop('grpc.host', 'localhost');
grpc.port = boot.sysprop('grpc.port', '50051');

// Import-resolution roots for the .proto — '/' is the project root, so a proto that imports another
// resolves from here. A single flat proto (as in this demo) does not need it, but real ones usually do.
grpc.protoRoots = ['/'];
