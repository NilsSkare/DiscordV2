static class DateTimeExtensions
{
    public static long ToUnixTime(this DateTime dateTime)
    {
        return ((DateTimeOffset)dateTime).ToUnixTimeMilliseconds();
    }
}