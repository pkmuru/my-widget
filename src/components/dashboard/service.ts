import { request } from './utils';

interface payloadProps {
  id: string;
  data?: object;
}

// Get dashboard information

export async function fetch(payload: payloadProps) {
  const { id } = payload;
  let url = '/accountUserSelf/getUserData';
  if (!id) {
    return;
  }
  return request(url, {
    method: 'GET',
    data: {
      dataId: id,
      dataType: 'dashboard',
    },
  });
}

// Modify Dashboard Information

export async function update(payload: payloadProps) {
  const { id, data } = payload;
  let url = '/accountUserSelf/setUserData';
  if (!id) {
    return;
  }
  return request(url, {
    method: 'POST',
    data: {
      dataId: id,
      dataType: 'dashboard',
      bigData: JSON.stringify(data),
    },
  });
}

//Delete applet information

export function removeWidgetApi(params: any) {
  const { widgetKey } = params;
  let url = '/accountUserSelf/delUserData';
  return request(url, {
    method: 'DELETE',
    data: {
      dataId: widgetKey,
      dataType: 'widget',
    },
  });
}
