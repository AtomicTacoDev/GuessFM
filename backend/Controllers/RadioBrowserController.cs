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

public class GuessLetterRequest
{
    public required char Letter { get; set; }
    public required string Answer { get; set; }
}


[ApiController]
[Route("[controller]")]
public class RadioBrowserController : ControllerBase
{
    private const string BaseUrl = "all.api.radio-browser.info";

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

    [HttpGet("getGameData")]
    public async Task<ActionResult<List<string>>> GetGameData()
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
                Console.WriteLine(radioStationData.Name);
                Console.WriteLine(regionInfo.EnglishName);
                Console.WriteLine("");

                return Ok(new Dictionary<string, object>
                {
                    ["broadcastUrl"] = radioStationData.UrlResolved.ToString(),
                    ["answer"] = regionInfo.EnglishName,
                    ["wordLengths"] = regionInfo.EnglishName.Split(' ').Select(word => word.Length).ToList()
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

    [HttpPost("guessLetter")]
    public ActionResult<List<int>> GuessLetter([FromBody] GuessLetterRequest request)
    {
        var whiteSpaceCount = 0;
        var indexes = new List<int>();
        for (var i = 0; i < request.Answer.Length; i++)
        {
            if (request.Answer[i] == ' ')
            {
                whiteSpaceCount++;
                continue;
            }
            if (request.Answer.ToLower()[i] != request.Letter) continue;
            
            indexes.Add(i - whiteSpaceCount);
        }
        
        return Ok(indexes);
    }
}