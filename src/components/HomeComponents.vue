<script setup>
import TransitHelper from "../helpers/TransitHelper.js";

import {onMounted} from 'vue';
import {reactive} from 'vue';
import {ElMessage} from 'element-plus';


const state = reactive({
    isLoading: true,
    isRefreshing: false,
    locationEnabled: true,
    searchedLocation: null,
    selectedLocation: null,
    stopList: [],
    geolocationDenied: false,
    nextUpdate: 30,
    netrains: [],
    swtrains: []
});

let stopData;

let getData = async () => {
    let data = await TransitHelper.getData(stopData, state.locationEnabled, state.selectedLocation);

    if (data[0] === "success") {
        state.isLoading = false;

        state.netrains = data[1]['NorthboundEastbound'];
        state.swtrains = data[1]['SouthboundWestbound'];
    } else {
        if (data[1].code === 1) {
            state.geolocationDenied = true;
        } else {
            ElMessage({
                showClose: true,
                message: data[1],
                duration: 0,
                type: 'error',
            })
        }
    }
};

let reload = () => {
    window.location.reload();
}

onMounted(async () => {
    stopData = await TransitHelper.getStopData();
    state.stopList = await TransitHelper.getStops(stopData);
    await getData();
    setTimeout(updateTick, 1000);
});

let updateTick = async () => {
    if (--state.nextUpdate <= 0) {
        state.isRefreshing = true;
        await getData();
        state.isRefreshing = false;
        state.nextUpdate = 30;
    }

    setTimeout(updateTick, 1000);
}

let handleLocationChange = (value) => {
    state.selectedLocation = value;
    state.isLoading = true;
    getData();
}

let handleGeolocationChange = (value) => {
    state.isLoading = true;
    getData();
}

</script>

<style scoped lang="scss">
.title {
  font-size: calc(var(--el-font-size-large) * 2);
  margin-bottom: 16px;
}

.search {
  margin-bottom: 8px;

  .location_switch {
    padding: 8px 0;
  }

  ̥
  .location_box, :deep(.el-select-v2) {
    width: 100%;
  }

}

.el-row {
  padding-bottom: 4px;
}

.el-main {
  padding: 0;
}

.el-container {
  padding: 0 4px;
}

.el-col {
  padding: 0 4px;
}

.el-card {
  --el-card-padding: 12px;
}

.header {
  .el-card {
    margin-bottom: 20px;
    background-color: #000055;
    color: #fff;
    font-size: var(--el-font-size-large);
    font-weight: bold !important;
  }
}

.trains {
  --color-normal: #DA251D;
  --color-night: #024182;
  --color-express: #00923F;
  --color-line1: #F8C300;
  --color-line2: #00923F;
  --color-line3: #0082C9;
  --color-line4: #A21A68;

  .normal {
    background-color: var(--color-normal);
    border-color: var(--color-normal);
  }

  .line-1 {
    background-color: var(--color-line1);
    border-color: var(--color-line1);
  }

  .line-2 {
    background-color: var(--color-line2);
    border-color: var(--color-line2);
  }

  .line-3 {
    background-color: var(--color-line3);
    border-color: var(--color-line3);
  }

  .line-4 {
    background-color: var(--color-line4);
    border-color: var(--color-line4);
  }

  .night {
    background-color: var(--color-night);
    border-color: var(--color-night);
  }

  .express {
    background-color: var(--color-express);
    border-color: var(--color-express);
  }

  .el-tag {
    font-weight: bold;

  }

  .stop {
    background-color: var(--el-color-info-light-5);
    font-size: var(--el-font-size-medium);

  }

  :deep(.el-card__header) {
    background-color: var(--el-fill-color);
  }

  .el-card {
    margin-bottom: 8px;
  }

  :deep(.primary_prediction) {
    margin-bottom: 4px;
    font-size: var(--el-font-size-extra-large);
  }

  :deep(.towards), :deep(.predictions) {
    font-size: var(--el-font-size-small);
  }

  .stop_gap {
    margin-bottom: calc(var(--el-main-padding) * 1.5);
  }
}

.refresh_text {
  font-size: var(--el-font-size-small);
  margin-left: 4px;
  margin-bottom: var(--el-main-padding);

}
</style>

<template>
    <el-container>
        <el-main>
            <el-row>
                <el-col :span="24" class="title">
                    <img src="android-chrome-192x192.png" height="32"
                         style="position: relative; left: 4̥px; top: 2px; margin-right: 16px;"/>TransitDash
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="24" class="search">
                    <div class="location_switch">
                        <el-switch v-model="state.locationEnabled"
                                   @change="handleGeolocationChange"
                                   active-text="Automatically Detect Location"/>
                    </div>
                    <div class="location_box" v-if="!state.locationEnabled">
                        <el-select-v2
                                @change="handleLocationChange"
                                v-model="state.searchedLocation"
                                placeholder="Search for a stop or station"
                                :options="state.stopList"
                                filterable
                                clearable/>
                    </div>
                </el-col>

            </el-row>
            <el-row class="header">
                <el-col :span="12">
                    <el-card>
                        <div>Northbound</div>
                        <div>Eastbound</div>
                    </el-card>
                </el-col>
                <el-col :span="12">
                    <el-card>
                        <div>Southbound</div>
                        <div>Westbound</div>
                    </el-card>
                </el-col>
            </el-row>
            <el-row v-if="state.isLoading">
                <el-col :span="24" style="text-align: center" v-if="!state.geolocationDenied || !state.locationEnabled">
                    <el-icon class="is-loading">
                        <Loading/>
                    </el-icon>
                </el-col>
                <el-col :span="24" v-else>
                    <el-result
                            icon="error"
                            title="Location Denied"
                            sub-title="Please disable 'Automatically Detect Location' above or allow this app to access your location"
                    >
                        <template #extra>
                            <el-button type="primary" @click="reload">Reload</el-button>
                        </template>
                    </el-result>
                </el-col>
            </el-row>
            <el-row class="trains" v-else>
                <el-col v-for="direction in [state.netrains, state.swtrains]" :span="12">
                    <div v-for="stop in direction">
                        <el-card class="stop">
                            {{ stop.stopName }}
                        </el-card>

                        <div v-for="route in stop.routes">
                            <el-card>

                                <template #header>
                                    <div>
                                        <el-tag :class="route.isSubway ? 'line-' + route.subwayLine : route.isExpress ? 'express' : route.isNight ? 'night' : 'normal'"
                                                effect="dark">{{ route.routeNo }}
                                        </el-tag>
                                        {{ route.name }}
                                    </div>
                                </template>
                                <div class="primary_prediction">
                                    <template v-if="!isNaN(route.firstPrediction)">
                                        {{ route.firstPrediction }} min
                                    </template>
                                    <template v-else>
                                        No predictions
                                    </template>
                                </div>
                                <div class="towards">
                                    <el-icon style="vertical-align: middle">
                                        <Guide/>
                                    </el-icon>
                                    {{ route.directionName }}
                                </div>
                                <div class="towards">
                                    <el-icon style="vertical-align: middle">
                                        <MapLocation/>
                                    </el-icon>
                                    {{ route.towards }}
                                </div>
                                <div class="predictions" v-if="route.predictionMinutes.length > 0">
                                    <el-icon style="vertical-align: middle">
                                        <Timer/>
                                    </el-icon>
                                    <template v-for="(predictionMinute, predictionIndex) in route.predictionMinutes">
                                        <template v-if="predictionIndex > 0"> &middot;</template>
                                        {{ predictionMinute }} min
                                    </template>
                                </div>
                            </el-card>

                        </div>
                        <div class="stop_gap"></div>

                    </div>

                </el-col>
            </el-row>

            <template v-if="!state.isLoading">
                <div class="refresh_text" v-if="!state.isRefreshing">
                    Next update in {{ state.nextUpdate }} seconds
                </div>
                <div class="refresh_text" v-else>
                    Updating times...
                    <el-icon class="is-loading">
                        <Loading/>
                    </el-icon>
                </div>
            </template>
        </el-main>
    </el-container>
</template>