using System.Net;
using System.Text.Json;
using Flurl.Http;
using Microsoft.AspNetCore.Mvc;

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
        
        private static async Task<string> GetApiUrlAsync()
        {
            var ipAddresses = await Dns.GetHostAddressesAsync(BaseUrl);
            var apiUrl = "de1.api.radio-browser.info";

            foreach (var ipAddress in ipAddresses)
            {
                var testUrl = $"https://{ipAddress}/json/stats";
                if (!await IsApiReachable(testUrl)) continue;
                
                apiUrl = ipAddress.ToString();
                break;
            }
            
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
                    var availableCountries = (await $"https://{apiUrl}/json/countries?hidebroken=true".GetJsonAsync<JsonElement>()).EnumerateArray().ToList();
                    var randomCountryData = availableCountries[new Random().Next(0, availableCountries.Count)];
                    var countryName = randomCountryData.GetProperty("name").GetString();
                    var countryCode = randomCountryData.GetProperty("iso_3166_1").GetString();
                    var radioStationsCount = randomCountryData.GetProperty("stationcount").GetInt32();
                    var randomIndex = new Random().Next(0, radioStationsCount);
                    var radioStationData = (await $"https://{apiUrl}/json/stations/bycountrycodeexact/{countryCode}?limit=1&offset{randomIndex}".GetJsonAsync<JsonElement>()).EnumerateArray().FirstOrDefault();
                    
                    return Ok(new Dictionary<string, object?>
                    {
                        ["broadcastUrl"] = radioStationData.GetProperty("url_resolved").GetString(),
                        ["answer"] = countryName,
                        ["wordLengths"] = countryName!.Split(' ').Select(word => word.Length).ToList()
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
