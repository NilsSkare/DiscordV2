using Discord;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    // mappen för statiska filer (index.html, osv...)
    WebRootPath = "public"
});

var app = builder.Build();
app.UseFileServer(); // använd statiska filer

static long ToUnixTime(DateTime dt)
{
    return ((DateTimeOffset)dt).ToUnixTimeMilliseconds();
}

var messages = new List<MessageDto>(){
    new("danne", "hej", ToUnixTime(DateTime.Now.AddDays(-6))),
    new("lennart", "och hå", ToUnixTime(DateTime.Now.AddDays(-2))),
    new("xX_Gandalf_Xx", "YOU SHALL NOT POST!", ToUnixTime(DateTime.Now.AddDays(-1))),
    new("birgitta69", "är nån vaken?", ToUnixTime(DateTime.Now.AddMinutes(-14))),
    new("danne", "@birgitta69 jo, jag är vaken", ToUnixTime(DateTime.Now.AddMinutes(-11))),
    new("max", "@danne snacka inte med min brud!", ToUnixTime(DateTime.Now.AddMinutes(-5))),
};

var globalCts = new CancellationTokenSource();

// Get för meddelanden
app.MapGet("/api/messages", async (HttpRequest request, CancellationToken ct) =>
{
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(globalCts.Token, app.Lifetime.ApplicationStopping, ct);

    if (request.Headers.TryGetValue("X-Poll", out var value) && value == "yes")
    {
        try
        {
            await Task.Delay(30 * 1000, cts.Token);
        }
        catch (TaskCanceledException) { }
    }
    return new { messages };
});

// Post för meddelanden
app.MapPost("/api/messages", async (MessageDto msg) =>
{
    if (string.IsNullOrWhiteSpace(msg.Message))
        return Results.BadRequest(new { error = "message får inte vara tom." });

    var user = string.IsNullOrWhiteSpace(msg.User) ? "Anonymous" : msg.User.Trim();
    var message = msg.Message.TrimEnd();

    // Ta fram unixtiden
    long time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    Console.WriteLine($"msg post: {msg.User} {time}: {msg.Message}");

    var saved = new MessageDto(user, message, time);
    messages.Add(saved);

    globalCts.Cancel();
    globalCts = new CancellationTokenSource();

    return Results.Ok(saved);
});

app.Run("http://localhost:3000");
