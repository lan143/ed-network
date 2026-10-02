#pragma once

#include "network.h"

#if defined(__has_include)
#  if __has_include(<ESPAsyncWebServer.h>) && __has_include(<ArduinoJson.h>)
#    define EDNETWORK_HAS_ASYNC_API 1
#  else
#    define EDNETWORK_HAS_ASYNC_API 0
#  endif
#else
#  define EDNETWORK_HAS_ASYNC_API 0
#endif

#if EDNETWORK_HAS_ASYNC_API

#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

namespace EDNetwork
{
    // Drop-in HTTP API for ESPAsyncWebServer.
    //
    // Construction: NetworkApi api(networkMgr); then api.registerRoutes(server);
    // Assumes the AsyncWebServer outlives this object (route lambdas capture this).
    // POST /api/network/settings accumulates the JSON body in a single buffer:
    // intended for one settings writer at a time (LAN provisioning use case).
    // Settings are held in RAM only — persist them via onSettingsChanged().
    // In ethernet mode wifi/AP settings are stored but take effect on mode switch or reboot.
    class NetworkApi
    {
    public:
        explicit NetworkApi(NetworkMgr& mgr) : _mgr(mgr) {}

        typedef std::function<bool(const Config&)> SettingsChangedFunction;

        void onSettingsChanged(SettingsChangedFunction fn) { _onSettingsChanged = std::move(fn); }
        void registerRoutes(AsyncWebServer& server);

    private:
        void handleWifiList(AsyncWebServerRequest* request);
        void handleGetSettings(AsyncWebServerRequest* request);
        void handleSettingsUpload(uint8_t* data, size_t len, size_t index, size_t total);
        void handlePostSettings(AsyncWebServerRequest* request);
        void handleStatus(AsyncWebServerRequest* request);
        void fillSettingsJson(JsonObject out) const;

        NetworkMgr& _mgr;
        SettingsChangedFunction _onSettingsChanged;
        String _jsonBody;
    };
}

#else

#warning "EDNetwork: ESPAsyncWebServer and ArduinoJson libraries are required for NetworkApi"

#endif
