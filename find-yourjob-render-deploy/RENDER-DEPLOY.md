# Render deployment

Publish this clean source package to a dedicated Git repository. In Render, create a Blueprint from that repository and verify the Free web service and the displayed price before provisioning. The web service runs Node and two loopback Python services in one Docker container. Render supplies the public HTTPS origin through RENDER_EXTERNAL_URL. Keep the service configured throughout judging. Free Render sleeps after 15 minutes idle and normally takes about a minute to wake. Its filesystem resets on restart or sleep. An existing PayPal Sandbox association may need to be set up again. Browser-local profile and plans stay in the same browser. AI usage follows the configured provider pricing.

Enter the values from your local configuration in the Render dashboard. Map ai.local.json url/model/key/provider to FYJ_AI_URL/MODEL/KEY/PROVIDER, adzuna.local.json app_id/app_key to FYJ_ADZUNA_APP_ID/APP_KEY, and paypal.local.json client_id/client_secret/plan_id to FYJ_PAYPAL_CLIENT_ID/CLIENT_SECRET/PLAN_ID. Never commit the filled configuration files. Use dedicated review credentials and keep their provider accounts funded or within quota.

After deployment, open /#/discover from a clean browser and run Try a sample resume, confirm, analyze, choose preferences and verify that a live listing loads. Test the Study Road and PayPal Sandbox with a dedicated test buyer. Provide judge-only test buyer access through the submission's testing instructions. Do not post payment credentials in the public repository.

This is a deployment configuration. It has not yet been built or deployed on Render.

