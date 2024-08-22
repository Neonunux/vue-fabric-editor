/*
 * @Author: 秦少卫
 * @Date: 2024-05-11 11:51:59
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-05-30 15:09:18
 * @Description: 素材相关
 */

import dayjs from 'dayjs';
import { useRouter, useRoute } from 'vue-router';
import { uploadImg, createdTempl, getTmplInfo, updataTempl, removeTempl } from '@/api/user';
import { Modal } from 'view-ui-plus';

import { useI18n } from 'vue-i18n';

export default function useMaterial() {
  const { t } = useI18n();
  const router = useRouter();
  const route = useRoute();
  const canvasEditor = inject('canvasEditor');

  // Create template
  const createTmpl = async (width, height, parentId = '') => {
    canvasEditor.clear();
    canvasEditor.setSize(width, height);
    const name = dayjs().format('YYYY-MM-DD-HH:mm:ss') + t('created-work');
    const data = await getCanvasCommonData();
    // Upload pictures
    const templInfo = await createdTempl({
      data: {
        ...data,
        type: 'file',
        parentId: String(parentId),
        name,
      },
    });
    routerToId(templInfo.data.data.id);
    return templInfo;
  };

  const createdFileType = async (name, parentId = '') => {
    await createdTempl({
      data: {
        name,
        type: 'fileType',
        parentId: String(parentId),
      },
    });
  };

  const createTmplByCommon = async () => {
    const name = dayjs().format('YYYY-MM-DD-HH:mm:ss') + t('created-work');
    const data = await getCanvasCommonData();
    // upload image
    const templInfo = await createdTempl({
      data: {
        ...data,
        type: 'file',
        parentId: '',
        externalId: route.query?.projectid || null,
        name,
      },
    });
    return templInfo;
  };

  // Get the canvas data
  const getCanvasCommonData = async () => {
    const json = canvasEditor.getJson();
    const fileInfo = await uploadFileToInfo();
    return {
      json,
      img: fileInfo.id,
      desc: '',
    };
  };

  // Canvas transfer picture
  const uploadFileToInfo = async () => {
    const dataURLtoFile = (dataurl, filename) => {
      var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    };

    const upload = (base64) => {
      const file = dataURLtoFile(base64, '123.png');
      const formData = new FormData();
      const time = new Date();
      formData.append('files', file, `${time.getTime()}`);
      return uploadImg(formData)
        .then((res) => {
          const [info] = res.data;
          return info;
        })
        .catch((err) => {
          console.log(err);
        });
    };
    const base64 = await canvasEditor.preview();
    // upload image
    const fileInfo = await upload(base64);
    return fileInfo;
  };

  // Update route
  const routerToId = (id) => {
    router.replace('/?id=' + id);
  };

  // Get details
  const getTemplInfo = async (id) => {
    const res = await getTmplInfo(id);
    return res.data;
  };

  // Update details
  const updataTemplInfo = async (id, name) => {
    const data = await getCanvasCommonData();
    name && (data.name = name);
    await updataTempl(id, {
      data,
    });
  };

  const removeTemplInfo = (id) => {
    return new Promise((resolve, reject) => {
      Modal.confirm({
        title: t('my_space.remove_templ'),
        content: `<p>${t('my_space.remove_templTip')}</p>`,
        onOk: () => {
          removeTempl(id).then(resolve).catch(reject);
        },
      });
    });
  };

  const removeFileType = (id) => {
    return new Promise((resolve, reject) => {
      Modal.confirm({
        title: t('my_spase.remove_file_type'),
        content: `<p>${t('my_spase.remove_file_type_Tip')}</p>`,
        onOk: () => {
          removeTempl(id).then(resolve).catch(reject);
        },
      });
    });
  };

  const reNameFileType = async (name, id) => {
    await updataTempl(id, {
      data: {
        name,
      },
    });
  };

  return {
    createTmpl,
    createTmplByCommon,
    getTemplInfo,
    updataTemplInfo,
    removeTemplInfo,
    routerToId,
    createdFileType, // Create a folder
    reNameFileType, // Modify the folder name
    removeFileType, // Delete the folder
  };
}
