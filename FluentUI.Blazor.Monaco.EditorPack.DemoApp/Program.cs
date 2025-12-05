using FluentUI.Blazor.Monaco.EditorPack.DemoApp.Components;
using FluentUI.Blazor.Monaco.EditorPack.DemoApp.Components.Infrastructure;
using FluentUI.Blazor.Monaco.EditorPack.Extensions;
using Microsoft.FluentUI.AspNetCore.Components;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults for Aspire
builder.AddServiceDefaults();

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddHttpClient();

// Add FluentUI Components (includes GlobalState service)
builder.Services.AddFluentUIComponents();
builder.Services.AddFluentUIServices();

// Add Monaco Editor Pack services (includes HtmlSanitizer configuration)
builder.Services.AddMonacoEditorPack();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();

app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
