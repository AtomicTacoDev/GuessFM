using System.Net;
using System.Net.NetworkInformation;
using Microsoft.AspNetCore.Mvc;

namespace GeoFM.Controllers;

[ApiController]
[Route("[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("getRadioStations")]
    public ActionResult<string> GetRadioStations()
    {
        var baseUrl = "all.api.radio-browser.info";
        var ips = Dns.GetHostAddresses(baseUrl);
        long lastRoundTripTime = long.MaxValue;
        string searchUrl = @"de1.api.radio-browser.info"; // Fallback
        
        foreach (IPAddress ipAddress in ips)
        {
            var reply = new Ping().Send(ipAddress);
            if (reply.RoundtripTime >= lastRoundTripTime) continue;

            lastRoundTripTime = reply.RoundtripTime;
            searchUrl = ipAddress.ToString();
        }
        
        IPHostEntry hostEntry = Dns.GetHostEntry(searchUrl);
        if (!string.IsNullOrEmpty(hostEntry.HostName))
        {
            searchUrl = hostEntry.HostName;
        }
        
        return Ok(searchUrl);
    }
}