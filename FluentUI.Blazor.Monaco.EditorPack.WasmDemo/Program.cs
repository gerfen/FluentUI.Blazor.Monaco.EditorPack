using FluentUI.Blazor.Monaco.EditorPack.Extensions;
using FluentUI.Blazor.Monaco.EditorPack.WasmDemo.Services;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.FluentUI.AspNetCore.Components;
using App = FluentUI.Blazor.Monaco.EditorPack.WasmDemo.App;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

// Register root components
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Configure HttpClient for static assets
builder.Services.AddScoped(sp => 
    new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// Add FluentUI Components
builder.Services.AddFluentUIComponents();

// Add Monaco Editor Pack services (includes HtmlSanitizer configuration)
builder.Services.AddMonacoEditorPack();

// Add PageTitle service
builder.Services.AddScoped<PageTitleService>();

await builder.Build().RunAsync();
