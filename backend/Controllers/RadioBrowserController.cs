using System.Globalization;
using System.Net;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Flurl.Http;
using RadioBrowser.Models;

namespace GuessFM.Controllers;

[ApiController]
[Route("[controller]")]
public class RadioBrowserController : ControllerBase
{
    private const string BaseUrl = "all.api.radio-browser.info";
    private const string HashSecretKey = "verymuchsecretkey";

    private static string GetApiUrl()
    {
        var ips = Dns.GetHostAddresses(BaseUrl);
        var longestRoundTripTime = long.MaxValue;
        var apiUrl = "de1.api.radio-browser.info";
        
        // Get api url with the lowest ping
        foreach (var ipAddress in ips)
        {
            var reply = new Ping().Send(ipAddress);
            if (reply.RoundtripTime >= longestRoundTripTime) continue;

            longestRoundTripTime = reply.RoundtripTime;
            apiUrl = ipAddress.ToString();
        }
        
        var hostEntry = Dns.GetHostEntry(apiUrl);
        if (!string.IsNullOrEmpty(hostEntry.HostName))
        {
            apiUrl = hostEntry.HostName;
        }

        return apiUrl;
    }

    [HttpGet("getRandomRadioStationUrl")]
    public async Task<ActionResult<List<string>>> GetRandomRadioStationUrl()
    {
        try
        {
            var apiUrl = GetApiUrl();

            try
            {
                var radioStationsCount = (await $"https://{apiUrl}/json/stats".GetJsonAsync<JsonElement>()).GetProperty("stations").GetInt32();
                var randomIndex = new Random().Next(0, radioStationsCount);
                var radioStationData = (await $"https://{apiUrl}/json/stations/search?limit=1&offset={randomIndex}".GetJsonAsync<List<StationInfo>>()).First();
                var regionInfo = new RegionInfo(radioStationData.CountryCode);
                Console.WriteLine(radioStationData.UrlResolved);
                Console.WriteLine(radioStationData.Name);
                Console.WriteLine(regionInfo.EnglishName);
                Console.WriteLine(radioStationData.LastCheckOk);

                var hmac = new HMACSHA256(Encoding.ASCII.GetBytes(HashSecretKey));
                var hashedCountry = hmac.ComputeHash(Encoding.ASCII.GetBytes(regionInfo.EnglishName));
                return Ok(new Dictionary<string, string>
                {
                    ["broadcastUrl"] = radioStationData.UrlResolved.ToString(),
                    ["hashedCountry"] = Convert.ToBase64String(hashedCountry),
                });
            }
            catch (FlurlHttpException ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, "Error fetching radio stations.");
            }
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            return StatusCode(500, "Error fetching radio browser api url.");
        }
    }
}