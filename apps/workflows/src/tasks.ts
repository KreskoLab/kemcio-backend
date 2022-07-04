export const useTaskData = (provide: string, id: string, element: string) => {
  return {
    requires: [id, element],
    provides: [provide],
    resolver: {
      name: 'NodeDataResolver',
      params: { deviceId: id, deviceElement: element },
      results: { data: provide },
    },
  };
};

export const useTaskIf = (provide: string, operator: string) => {
  const trueRes = provide + 'true';
  const falseRes = provide + 'false';

  return {
    requires: [operator] as string[],
    provides: [trueRes, falseRes],
    resolver: {
      name: 'NodeIfResolver',
      params: { a: '', b: '', operator: operator },
      results: { trueResult: trueRes, falseResult: falseRes },
    },
  };
};

export const useTaskDelay = (provide: string, delay: string) => {
  return {
    requires: [delay] as string[],
    provides: [provide],
    resolver: {
      name: 'flowed::Wait',
      params: { ms: delay },
      results: { result: provide },
    },
  };
};

export const useTaskCommand = (id: string, element: string, value: string) => {
  return {
    requires: [id, element, value] as string[],
    provides: [],
    resolver: {
      name: 'NodeCommandResolver',
      params: { deviceId: id, deviceElement: element, deviceValue: value },
      results: { result: '' },
    },
  };
};
