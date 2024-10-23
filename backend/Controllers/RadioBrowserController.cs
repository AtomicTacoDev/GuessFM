using System.Globalization;
using System.Net;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Text.Json;
using System.Threading.Tasks;
using Flurl.Http;
using Microsoft.AspNetCore.Mvc;
using RadioBrowser.Models;

namespace GuessFM.Controllers
{
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

        // Method to check if a given URL is reachable
        private static async Task<bool> IsApiReachable(string url)
        {
            using var httpClient = new HttpClient();
            try
            {
                var response = await httpClient.GetAsync(url);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        // Method to get the best API URL
        private static async Task<string> GetApiUrlAsync()
        {
            var ipAddresses = Dns.GetHostAddresses(BaseUrl);
            var apiUrl = "de1.api.radio-browser.info"; // Default

            foreach (var ipAddress in ipAddresses)
            {
                // Using HttpClient instead of Ping
                var testUrl = $"https://{ipAddress}/json/stats";
                if (await IsApiReachable(testUrl))
                {
                    apiUrl = ipAddress.ToString();
                    break; // Found a reachable API
                }
            }

            // Check if the apiUrl is reachable
            if (!await IsApiReachable($"https://{apiUrl}/json/stats"))
            {
                throw new Exception("None of the API URLs are reachable.");
            }

            return apiUrl;
        }

        [HttpGet("getGameData")]
        public async Task<ActionResult<Dictionary<string, object>>> GetGameData()
        {
            try
            {
                var apiUrl = await GetApiUrlAsync();

                try
                {
                    var radioStationsCount = (await $"https://{apiUrl}/json/stats".GetJsonAsync<JsonElement>()).GetProperty("stations").GetInt32();
                    var randomIndex = new Random().Next(0, radioStationsCount);
                    var radioStationData = (await $"https://{apiUrl}/json/stations/search?limit=1&offset={randomIndex}".GetJsonAsync<List<StationInfo>>()).First();
                    var regionInfo = new RegionInfo(radioStationData.CountryCode);

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
                return StatusCode(500, "Error fetching radio browser API URL.");
            }
        }

        [HttpPost("guessLetter")]
        public ActionResult<List<int>> GuessLetter([FromBody] GuessLetterRequest request)
        {
            var currentLetterIndex = 0;
            var indexes = new List<int>();
            for (var i = 0; i < request.Answer.Length; i++)
            {
                if (request.Answer.ToLower()[i] < 'a' || request.Answer.ToLower()[i] > 'z') continue;

                if (request.Answer.ToLower()[i] == request.Letter) indexes.Add(currentLetterIndex);
                currentLetterIndex++;
            }

            return Ok(indexes);
        }
    }
}
