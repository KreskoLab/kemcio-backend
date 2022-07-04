import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ValueMap } from 'flowed';
import { firstValueFrom } from 'rxjs';

export class NodeDataResolver {
  private readonly httpService = new HttpService();
  private readonly configService = new ConfigService();

  public async exec(params: ValueMap): Promise<ValueMap> {
    const url = this.configService.get<string>('GATEWAY_URL');
    const res = await firstValueFrom(
      this.httpService.get<string>(`${url}/devices/${params.deviceId}/${params.deviceElement}`),
    );

    return { data: res.data.split(/(\s+)/)[0] };
  }
}

export class NodeIfResolver {
  public exec(params: ValueMap): ValueMap {
    let res = false;

    switch (params.operator) {
      case 'NodeGt':
        if (Number(params.a) > Number(params.b)) res = true;
        break;

      case 'NodeLt':
        if (Number(params.a) < Number(params.b)) res = true;
        break;

      case 'NodeEqual':
        if (params.a == params.b) res = true;
        break;
    }

    if (res) {
      return { trueResult: res };
    } else {
      return { falseResult: res };
    }
  }
}

export class NodeCommandResolver {
  private readonly httpService = new HttpService();
  private readonly configService = new ConfigService();

  public async exec(params: ValueMap): Promise<object> {
    const url = this.configService.get<string>('GATEWAY_URL');

    await firstValueFrom(
      this.httpService.post(`${url}/devices/${params.deviceId}/command`, {
        name: params.deviceElement,
        value: params.deviceValue,
      }),
    );

    return { results: 'ok' };
  }
}
