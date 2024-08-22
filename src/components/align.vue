<!--
 * @Author: 秦少卫
 * @Date: 2022-09-03 19:16:55
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-07-16 15:17:28
 * @Description: 组合元素对齐
-->

<template>
  <div v-if="mixinState.mSelectMode === 'multiple'" class="attr-item-box">
    <!-- <h3>Alignment</h3> -->
    <Divider plain orientation="left">
      <h4>{{ $t('group.align') }}</h4>
    </Divider>
    <div class="bg-item">
      <!-- Level alignment -->
      <Tooltip :content="$t('attrSeting.align.left')">
        <Button @click="left" size="small" type="text">
          <leftIcon />
        </Button>
      </Tooltip>
      <Tooltip :content="$t('attrSeting.align.centerX')">
        <Button @click="xcenter" size="small" type="text">
          <centerxIcon />
        </Button>
      </Tooltip>
      <Tooltip :content="$t('attrSeting.align.right')">
        <Button @click="right" size="small" type="text">
          <rightIcon />
        </Button>
      </Tooltip>
      <!-- Vertical alignment -->
      <Tooltip :content="$t('attrSeting.align.top')">
        <Button @click="top" size="small" type="text">
          <topIcon />
        </Button>
      </Tooltip>
      <Tooltip :content="$t('attrSeting.align.centerY')">
        <Button @click="ycenter" size="small" type="text">
          <centeryIcon />
        </Button>
      </Tooltip>
      <Tooltip :content="$t('attrSeting.align.bottom')">
        <Button @click="bottom" size="small" type="text">
          <bottomIcon />
        </Button>
      </Tooltip>
      <!-- Average alignment -->
      <Tooltip :content="$t('attrSeting.align.averageX')">
        <Button @click="xequation" size="small" type="text">
          <sxIcon />
        </Button>
      </Tooltip>
      <Tooltip :content="$t('attrSeting.align.averageY')">
        <Button @click="yequation" size="small" type="text">
          <syIcon />
        </Button>
      </Tooltip>
    </div>
    <!-- <Divider plain></Divider> -->
  </div>
</template>

<script name="Align" setup>
import useSelect from '@/hooks/select';

import leftIcon from '@/assets/icon/left.svg';
import rightIcon from '@/assets/icon/right.svg';

import topIcon from '@/assets/icon/top.svg';
import bottomIcon from '@/assets/icon/bottom.svg';

import sxIcon from '@/assets/icon/sx.svg';
import syIcon from '@/assets/icon/sy.svg';

import centerxIcon from '@/assets/icon/centerx.svg';
import centeryIcon from '@/assets/icon/centery.svg';

const { mixinState, canvasEditor } = useSelect();

// Left-handed alignment
const left = () => {
  canvasEditor.left();
};
// Right alignment
const right = () => {
  canvasEditor.right();
};
// Horizontal alignment
const xcenter = () => {
  canvasEditor.xcenter();
};
// Vertical alignment
const ycenter = () => {
  canvasEditor.ycenter();
};
// Top alignment
const top = () => {
  canvasEditor.top();
};
// Alignment at the bottom
const bottom = () => {
  canvasEditor.bottom();
};
// Average level alignment
const xequation = () => {
  canvasEditor.xequation();
};
// Vertical average
const yequation = () => {
  canvasEditor.yequation();
};
</script>

<style scoped lang="less">
.icon {
  width: 100%;
  height: auto;
}
</style>
