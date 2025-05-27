export default {
  async scheduled(event, env, ctx) {
    const zoneId = env.ZONE_ID;
    const apiEmail = env.CLOUDFLARE_EMAIL;
    const apiKey = env.CLOUDFLARE_API_KEY;
    const domainName = env.DOMAIN_NAME;

    // Use current time (in minutes) to alternate every 2 minutes
    const currentMinuteUTC = Math.floor(new Date().getUTCMinutes() / 2);

    // Alternate IP addresses every 2 minutes
    const ipAddress = currentMinuteUTC % 2 === 0 ? "192.168.1.1" : "192.168.2.1";

    const getRecordsUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${domainName}`;
    
    try {
      // Fetch existing DNS records
      const getRecordsResponse = await fetch(getRecordsUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": apiEmail,
          "X-Auth-Key": apiKey,
        }
      });

      const recordsResult = await getRecordsResponse.json();
      if (!recordsResult.success || !recordsResult.result || recordsResult.result.length === 0) {
        console.error("DNS record not found for domain:", domainName);
        return;
      }

      // Get the ID of the first DNS record found (assuming you're updating the first matching A record)
      const dnsRecordId = recordsResult.result[0].id;

      // Prepare the body for the PATCH request
      const patchUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${dnsRecordId}`;
      const requestBody = {
        type: "A",
        name: domainName,
        content: ipAddress,
        ttl: 120,
      };

      // Update the DNS record using PATCH
      const patchResponse = await fetch(patchUrl, {
        method: "PATCH", // Use PATCH instead of PUT
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Email": apiEmail,
          "X-Auth-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const patchResult = await patchResponse.json();

      // Log the result of the PATCH request
      if (patchResponse.ok && patchResult.success) {
        console.log(`DNS record updated to ${ipAddress} for ${domainName}`);
      } else {
        console.error("Error updating DNS record:", patchResult.errors || patchResult);
      }
    } catch (error) {
      console.error("Request failed:", error);
    }
  }
};

