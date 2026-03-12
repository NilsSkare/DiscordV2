namespace Discord;

using System.Text.Json.Serialization;

public record MessageDto(
    [property: JsonPropertyName("user")] string User,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("time")] long Time = 0);
