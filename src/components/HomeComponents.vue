<script setup>
import TransitHelper from "../helpers/TransitHelper.js";

import {onMounted} from 'vue';
import {reactive} from 'vue';
import {ElMessage} from 'element-plus';


const state = reactive({
    isLoading: true,
    isRefreshing: false,
    nextUpdate: 30,
    netrains: [],
    swtrains: []
});

let getData = async () => {
    let data = await TransitHelper.getData();

    if (data[0] === "success") {
        state.isLoading = false;
        state.netrains = data[1]['NorthboundEastbound'];
        state.swtrains = data[1]['SouthboundWestbound'];
    } else {
        ElMessage({
            showClose: true,
            message: data[1],
            duration: 0,
            type: 'error',
        })
    }
};

onMounted(async () => {
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

</script>

<style scoped lang="scss">
//@use "element-plus/theme-chalk/src/common/var" as *;
//
//.header {
//  .el-col {
//    div {
//      background-color: $color-info;
//      color: $color-black;
//    margin: 16px;
//    }
//  }
//}
//


.el-row {
  padding-bottom: 4px;
}

.el-main {
  padding: 0;
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
    background-color: var(--el-color-danger);
    color: var(--el-color-danger-light-9);
    font-size: var(--el-font-size-large);
    font-weight: bold !important;
  }
}

.trains {
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
    <!--    <pre>{{ state.rawText }}</pre>-->
    <el-container>
        <el-main>
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
                <el-col :span="24" style="text-align: center">
                    <el-icon class="is-loading">
                        <Loading/>
                    </el-icon>
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
                                        <el-tag type="danger" effect="dark">{{ route.routeNo }}</el-tag>
                                        {{ route.name }}
                                    </div>
                                </template>
                                <div class="primary_prediction">
                                    {{ route.firstPrediction }} min
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