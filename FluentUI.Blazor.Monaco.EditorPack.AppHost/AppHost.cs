var builder = DistributedApplication.CreateBuilder(args);

// Server Interactive Demo (Blazor Server with SignalR)
builder.AddProject<Projects.FluentUI_Blazor_Monaco_EditorPack_DemoApp>("server-demo")
    .WithExternalHttpEndpoints();

// WebAssembly Demo (Client-side only, static hosting)
builder.AddProject<Projects.FluentUI_Blazor_Monaco_EditorPack_WasmDemo>("wasm-demo")
    .WithExternalHttpEndpoints();

builder.Build().Run();
