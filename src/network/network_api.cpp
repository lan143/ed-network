#include "network_api.h"

#if EDNETWORK_HAS_ASYNC_API

#include <WiFi.h>
#include <ETH.h>
#include <esp_log.h>
#include <string.h>
#include <vector>

namespace
{
    void makeResponse(AsyncWebServerRequest* request, int code, JsonDocument& doc)
    {
        String body;
        serializeJson(doc, body);
        request->send(code, "application/json", body);
    }

    bool parseBool(const String& value, bool& out)
    {
        if (value == "1" || value == "true" || value == "TRUE" || value == "True") {
            out = true;
            return true;
        }
        if (value == "0" || value == "false" || value == "FALSE" || value == "False") {
            out = false;
            return true;
        }
        return false;
    }
}

void EDNetwork::NetworkApi::registerRoutes(AsyncWebServer& server)
{
    server.on("/api/wifi/list", HTTP_GET, [this](AsyncWebServerRequest* r) { handleWifiList(r); });
    server.on("/api/network/settings", HTTP_GET, [this](AsyncWebServerRequest* r) { handleGetSettings(r); });
    server.on("/api/network/settings", HTTP_POST, [this](AsyncWebServerRequest* r) { handlePostSettings(r); }, [this](uint8_t* d, size_t l, size_t i, size_t t) { handleSettingsUpload(d, l, i, t); });
    server.on("/api/network/status", HTTP_GET, [this](AsyncWebServerRequest* r) { handleStatus(r); });
}

void EDNetwork::NetworkApi::handleWifiList(AsyncWebServerRequest* request)
{
    bool restoreAp = (WiFi.getMode() == WIFI_AP);
    if (restoreAp) {
        WiFi.mode(WIFI_AP_STA);
    }

    // no-arg scan is synchronous and active on both arduino-esp32 v2 and v3
    int n = WiFi.scanNetworks();

    if (restoreAp) {
        WiFi.mode(WIFI_AP);
    }

    JsonDocument doc;

    if (n < 0) {
        doc["error"] = "scan failed";
        makeResponse(request, 500, doc);
        return;
    }

    // keep ssid strings alive until serializeJson: ArduinoJson does not copy string values
    std::vector<String> ssids;
    ssids.reserve(n);
    for (int i = 0; i < n; i++) {
        ssids.push_back(WiFi.SSID(i));
    }

    JsonArray networks = doc["networks"].to<JsonArray>();
    for (int i = 0; i < n; i++) {
        JsonObject net = networks.add<JsonObject>();
        net["ssid"] = ssids[i];
        net["rssi"] = WiFi.RSSI(i);
        net["channel"] = WiFi.channel(i);
        net["encrypted"] = (WiFi.encryptionType(i) != WIFI_AUTH_OPEN);
    }
    WiFi.scanDelete();

    makeResponse(request, 200, doc);
}

void EDNetwork::NetworkApi::handleGetSettings(AsyncWebServerRequest* request)
{
    JsonDocument doc;
    JsonObject root = doc.to<JsonObject>();
    fillSettingsJson(root);
    makeResponse(request, 200, doc);
}

void EDNetwork::NetworkApi::fillSettingsJson(JsonObject out) const
{
    const EDNetwork::Config& config = _mgr.config();
    out["isAPMode"] = config.isAPMode;
    out["wifiAPSSID"] = config.wifiAPSSID;
    out["wifiAPHasPassword"] = config.wifiAPHasPassword;
    out["wifiSSID"] = config.wifiSSID;
    out["hasWifiPassword"] = strlen(config.wifiPassword) > 0;
    out["hasWifiAPPassword"] = strlen(config.wifiAPPassword) > 0;
}

void EDNetwork::NetworkApi::handleSettingsUpload(uint8_t* data, size_t len, size_t index, size_t total)
{
    if (index == 0) {
        _jsonBody = "";
    }

    if (total > 2048) {
        return;
    }

    _jsonBody.concat((const char*)data, len);
}

void EDNetwork::NetworkApi::handlePostSettings(AsyncWebServerRequest* request)
{
    if (request->contentLength() > 2048) {
        JsonDocument doc;
        doc["error"] = "request body too large";
        makeResponse(request, 400, doc);
        _jsonBody = "";
        return;
    }

    EDNetwork::Config cur = _mgr.config();

    JsonDocument incoming;
    // only trust a fully received body; a stale/partial buffer from an interrupted
    // upload must not poison arg-only requests
    if (_jsonBody.length() > 0 && _jsonBody.length() == request->contentLength() && _jsonBody[0] == '{') {
        DeserializationError err = deserializeJson(incoming, _jsonBody);
        if (err) {
            JsonDocument doc;
            doc["error"] = "invalid json";
            makeResponse(request, 400, doc);
            _jsonBody = "";
            return;
        }
    }

    auto fail = [&](int code, const char* message) {
        JsonDocument doc;
        doc["error"] = message;
        makeResponse(request, code, doc);
        _jsonBody = "";
    };

    auto hasValue = [&](const char* key) -> bool {
        if (!incoming.isNull() && !incoming[key].isNull()) {
            return true;
        }
        return request->hasArg(key);
    };

    auto getString = [&](const char* key, String& out) -> bool {
        if (!incoming.isNull() && !incoming[key].isNull()) {
            if (!incoming[key].is<const char*>()) {
                return false;
            }
            out = incoming[key].as<const char*>();
            return true;
        }
        out = request->arg(key);
        return true;
    };

    auto getBool = [&](const char* key, bool& out) -> bool {
        if (!incoming.isNull() && !incoming[key].isNull()) {
            JsonVariant value = incoming[key];
            if (value.is<bool>()) {
                out = value.as<bool>();
                return true;
            }
            if (value.is<int>()) {
                out = value.as<int>() != 0;
                return true;
            }
            if (value.is<const char*>()) {
                String s = value.as<const char*>();
                return parseBool(s, out);
            }
            return false;
        }
        return parseBool(request->arg(key), out);
    };

    String value;

    if (hasValue("wifiSSID")) {
        if (!getString("wifiSSID", value)) {
            fail(400, "invalid wifiSSID");
            return;
        }
        if (value.length() >= WIFI_SSID_LEN) {
            fail(400, "wifiSSID too long");
            return;
        }
        strncpy(cur.wifiSSID, value.c_str(), WIFI_SSID_LEN);
        cur.wifiSSID[WIFI_SSID_LEN - 1] = '\0';
    }

    if (hasValue("wifiPassword")) {
        if (!getString("wifiPassword", value)) {
            fail(400, "invalid wifiPassword");
            return;
        }
        if (value.length() >= WIFI_PWD_LEN) {
            fail(400, "wifiPassword too long");
            return;
        }
        strncpy(cur.wifiPassword, value.c_str(), WIFI_PWD_LEN);
        cur.wifiPassword[WIFI_PWD_LEN - 1] = '\0';
    }

    if (hasValue("wifiAPSSID")) {
        if (!getString("wifiAPSSID", value)) {
            fail(400, "invalid wifiAPSSID");
            return;
        }
        if (value.length() >= WIFI_SSID_LEN) {
            fail(400, "wifiAPSSID too long");
            return;
        }
        strncpy(cur.wifiAPSSID, value.c_str(), WIFI_SSID_LEN);
        cur.wifiAPSSID[WIFI_SSID_LEN - 1] = '\0';
    }

    if (hasValue("wifiAPPassword")) {
        if (!getString("wifiAPPassword", value)) {
            fail(400, "invalid wifiAPPassword");
            return;
        }
        if (value.length() >= WIFI_PWD_LEN) {
            fail(400, "wifiAPPassword too long");
            return;
        }
        strncpy(cur.wifiAPPassword, value.c_str(), WIFI_PWD_LEN);
        cur.wifiAPPassword[WIFI_PWD_LEN - 1] = '\0';
    }

    if (hasValue("isAPMode")) {
        bool isAPMode = false;
        if (!getBool("isAPMode", isAPMode)) {
            fail(400, "invalid isAPMode");
            return;
        }
        cur.isAPMode = isAPMode;
    }

    if (hasValue("wifiAPHasPassword")) {
        bool hasPassword = false;
        if (!getBool("wifiAPHasPassword", hasPassword)) {
            fail(400, "invalid wifiAPHasPassword");
            return;
        }
        cur.wifiAPHasPassword = hasPassword;
    }

    if (!cur.wifiAPHasPassword) {
        cur.wifiAPPassword[0] = '\0';
    }

    if (cur.wifiAPHasPassword && strlen(cur.wifiAPPassword) < 8) {
        fail(400, "wifiAPPassword must be at least 8 characters");
        return;
    }

    if (cur.isAPMode && cur.wifiAPSSID[0] == '\0') {
        fail(400, "wifiAPSSID required in AP mode");
        return;
    }

    if (!cur.isAPMode && cur.wifiSSID[0] == '\0') {
        fail(400, "wifiSSID required in client mode");
        return;
    }

    if (_onSettingsChanged && !_onSettingsChanged(cur)) {
        fail(500, "settings rejected by controller");
        return;
    }

    EDNetwork::Config& live = _mgr.config();
    live.isAPMode = cur.isAPMode;
    memcpy(live.wifiAPSSID, cur.wifiAPSSID, WIFI_SSID_LEN);
    live.wifiAPHasPassword = cur.wifiAPHasPassword;
    memcpy(live.wifiAPPassword, cur.wifiAPPassword, WIFI_PWD_LEN);
    memcpy(live.wifiSSID, cur.wifiSSID, WIFI_SSID_LEN);
    memcpy(live.wifiPassword, cur.wifiPassword, WIFI_PWD_LEN);

    _jsonBody = "";

    JsonDocument doc;
    JsonObject root = doc.to<JsonObject>();
    fillSettingsJson(root);
    makeResponse(request, 200, doc);

    // apply last: reconfiguring the interface may drop the connection serving this request
    _mgr.applyConfig();
}

void EDNetwork::NetworkApi::handleStatus(AsyncWebServerRequest* request)
{
    const char* mode = "wifi_ap";
    switch (_mgr.mode()) {
        case EDNetwork::MODE_ETHERNET:
            mode = "ethernet";
            break;
        case EDNetwork::MODE_WIFI:
            mode = "wifi";
            break;
        case EDNetwork::MODE_WIFI_AP:
            mode = "wifi_ap";
            break;
    }

    JsonDocument doc;
    doc["mode"] = mode;
    doc["connected"] = _mgr.isConnected();
    doc["wifiConnected"] = _mgr.isWiFiConnected();
    doc["ethernetConnected"] = _mgr.isEthernetConnected();
    doc["fallbackAP"] = _mgr.isFallbackAP();

    String ssid;
    String ip;
    String mac;
    if (WiFi.status() == WL_CONNECTED) {
        ssid = WiFi.SSID();
        ip = WiFi.localIP().toString();
        mac = WiFi.macAddress();
    }

    String apSsid;
    String apIp;
    if (_mgr.mode() == EDNetwork::MODE_WIFI_AP) {
        apSsid = WiFi.softAPSSID();
        apIp = WiFi.softAPIP().toString();
    }

    String ethIp;
    String ethMac;
    if (_mgr.mode() == EDNetwork::MODE_ETHERNET) {
        ethIp = ETH.localIP().toString();
        ethMac = ETH.macAddress();
    }

    if (WiFi.status() == WL_CONNECTED) {
        doc["ssid"] = ssid;
        doc["rssi"] = WiFi.RSSI();
        doc["ip"] = ip;
        doc["mac"] = mac;
    }

    if (_mgr.mode() == EDNetwork::MODE_WIFI_AP) {
        JsonObject ap = doc["ap"].to<JsonObject>();
        ap["ssid"] = apSsid;
        ap["ip"] = apIp;
        ap["stations"] = WiFi.softAPgetStationNum();
    }

    if (_mgr.mode() == EDNetwork::MODE_ETHERNET) {
        JsonObject eth = doc["eth"].to<JsonObject>();
        eth["ip"] = ethIp;
        eth["mac"] = ethMac;
        eth["linkUp"] = ETH.linkUp();
        eth["speed"] = (int)ETH.speed();
        eth["duplex"] = (int)ETH.duplex();
    }

    makeResponse(request, 200, doc);
}

#endif
