using Discord;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    // mappen för statiska filer (index.html, osv...)
    WebRootPath = "public"
});

var app = builder.Build();
app.UseFileServer(); // använd statiska filer
app.UseWebSockets();

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

HashSet<WebSocket> activeSockets = new();

app.Map("/api/connect", async (HttpContext context) =>
{
    // Avsluta om requesten inte är en websocket request.
    if (!context.WebSockets.IsWebSocketRequest)
    {
        Console.WriteLine("Invalid socket request");
        context.Response.StatusCode = 400;
        return;
    }

    using var socket = await context.WebSockets.AcceptWebSocketAsync();

    // Kombinera cancellationtoken för request och appens livstid
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(
        context.RequestAborted,
        app.Lifetime.ApplicationStopping
    );

    var buffer = new byte[1024];

    if (socket.State == WebSocketState.Open)
    {
        activeSockets.Add(socket);

        // Skicka över alla gamla meddelanden
        for (int i = 0; i < messages.Count; i++)
        {
            var msg = messages[i];
            var response = Encoding.UTF8.GetBytes(
                    JsonSerializer.Serialize<MessageDto>(msg));
            await socket.SendAsync(
                response,
                System.Net.WebSockets.WebSocketMessageType.Text,
                true,
                cts.Token);
        }
    }

    try
    {
        while (socket.State == WebSocketState.Open)
        {
            using var ms = new MemoryStream();
            WebSocketReceiveResult result;
            do
            {
                result = await socket.ReceiveAsync(buffer, cts.Token);
                ms.Write(buffer, 0, result.Count);
            } while (!result.EndOfMessage);

            if (result.MessageType == System.Net.WebSockets.WebSocketMessageType.Text)
            {
                var msgJsonStr = Encoding.UTF8.GetString(ms.ToArray());
                var msg = JsonSerializer.Deserialize<MessageDto>(msgJsonStr);

                // Ta fram unixtiden
                long timeNow = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                var saved = new MessageDto(msg.User, msg.Message, timeNow);
                Console.WriteLine(
                    $"msg received: {saved.User} {saved.Time}: {saved.Message}");
                messages.Add(saved);

                var response = Encoding.UTF8.GetBytes(
                    JsonSerializer.Serialize<MessageDto>(saved));

                var taskSend = activeSockets.Select(s => s.SendAsync(
                        response,
                        System.Net.WebSockets.WebSocketMessageType.Text,
                        true,
                        cts.Token));
                await Task.WhenAll(taskSend);
            }
        }

        if (socket.State == WebSocketState.CloseReceived)
        {
            await socket.CloseAsync(
                WebSocketCloseStatus.NormalClosure,
                "Closed",
                cts.Token);
        }
    }
    finally
    {
        activeSockets.Remove(socket);
    }

    Console.WriteLine("Closing socket");
});

app.Run("http://localhost:3000");
