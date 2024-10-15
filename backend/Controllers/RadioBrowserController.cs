using System.Net;
using System.Net.NetworkInformation;
using Microsoft.AspNetCore.Mvc;
using Flurl.Http;
using RadioBrowser.Models;

namespace GeoFM.Controllers;

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

    [HttpGet("getRandomRadioStationUrl")]
    public async Task<ActionResult<string>> GetRandomRadioStationUrl()
    {
        try
        {
            var apiUrl = GetApiUrl();

            try
            {
                var radioStations = await $"http://{apiUrl}/json/stations".GetJsonAsync<List<StationInfo>>();
                var randomStationData = radioStations.OrderBy(x => Guid.NewGuid()).FirstOrDefault();
                
                return randomStationData == null ? StatusCode(500, "Could not get random radio station") : Ok(randomStationData.UrlResolved);
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