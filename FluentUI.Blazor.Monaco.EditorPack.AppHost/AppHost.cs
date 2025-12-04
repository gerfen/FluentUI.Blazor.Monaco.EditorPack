var builder = DistributedApplication.CreateBuilder(args);

//var apiService = builder.AddProject<Projects.FluentUI_Blazor_Monaco_EditorPack_AspireApp_ApiService>("apiservice")
//    .WithHttpHealthCheck("/health");

//builder.AddProject<Projects.FluentUI_Blazor_Monaco_EditorPack_AspireApp_Web>("webfrontend")
//    .WithExternalHttpEndpoints()
//    .WithHttpHealthCheck("/health")
//    .WithReference(apiService)
//    .WaitFor(apiService);

builder.AddProject<Projects.FluentUI_Blazor_Monaco_EditorPack_DemoApp>("webfrontend")
    .WithExternalHttpEndpoints();
   // .WithHttpHealthCheck("/health");

builder.Build().Run();
