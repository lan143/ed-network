#include <WiFi.h>
#include <ESPAsyncWebServer.h>

#include "network/network.h"
#include "network/network_api.h"

EDNetwork::NetworkMgr network;
EDNetwork::NetworkApi api(network);
AsyncWebServer server(80);

void setup()
{
    Serial.begin(115200);

    EDNetwork::Config config;
    config.isAPMode = false;
    strncpy(config.wifiSSID, "MyHomeWifi", WIFI_SSID_LEN);
    strncpy(config.wifiPassword, "password", WIFI_PWD_LEN);
    config.wifiAPHasPassword = true;
    strncpy(config.wifiAPSSID, "EDController-AP", WIFI_SSID_LEN);
    strncpy(config.wifiAPPassword, "ap-password", WIFI_PWD_LEN);

    network.init(config, false);

    api.onSettingsChanged([](const EDNetwork::Config& config) {
        // Persist the new settings here (for example with Preferences/NVS)
        // before returning true. Return false to reject the change.
        (void)config;
        return true;
    });

    api.registerRoutes(server);
    server.begin();
}

void loop()
{
    network.loop();
}
