var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    // mappen för statiska filer (index.html, osv...)
    WebRootPath = "public"
});

var app = builder.Build();

app.UseFileServer();
app.UseWebSockets();

app.Run("http://localhost:3000");
