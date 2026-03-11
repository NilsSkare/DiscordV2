var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapStaticAssets();
app.UseStaticFiles();
app.UseWebSockets();

app.Run();
