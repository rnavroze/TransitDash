<script setup>
import TransitHelper from "../helpers/TransitHelper.js";

import {onMounted} from 'vue'
import {reactive} from 'vue'

const state = reactive({netrains: [], swtrains: []});

onMounted(async () => {
    let data = await TransitHelper.testing();
    state.netrains = data['Northbound'].concat(data['Eastbound']);
    state.swtrains = data['Southbound'].concat(data['Westbound']);
})

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

.trains {
  :deep(.el-card__header) {
    background-color: var(--el-fill-color);
  }

  .el-card {
    --el-card-padding: 12px;
    margin-bottom: 8px;
  }
}
</style>

<template>
    <!--    <pre>{{ state.rawText }}</pre>-->
    <el-container>
        <el-main>
            <el-row class="header">
                <el-col :span="12">
                    <div>Northbound</div>
                    <div>Eastbound</div>
                </el-col>
                <el-col :span="12">
                    <div>Southbound</div>
                    <div>Westbound</div>
                </el-col>
            </el-row>
            <el-row class="trains">
                <el-col v-for="direction in [state.netrains, state.swtrains]" :span="12">
                    <div v-for="stop in direction">
                        {{ stop.stopName }}

                        <div v-for="route in stop.routes">
                            <el-card>

                                <template #header>
                                    <el-tag type="danger" effect="dark">{{ route.routeNo }}</el-tag>
                                    {{ route.name }}
                                </template>
                                <div v-for="predictionMinute in route.predictionMinutes">
                                    <el-row>
                                        {{ predictionMinute }} min
                                    </el-row>
                                </div>
                            </el-card>

                        </div>
                    </div>
                </el-col>
            </el-row>
        </el-main>
    </el-container>
</template>