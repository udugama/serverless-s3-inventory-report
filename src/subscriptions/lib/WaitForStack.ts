import { InternalError, NotFoundError, TemandoError } from '@temando/errors';
import { delay, map } from 'bluebird';

/**
 * poll aws api till the resource is ready.
 *
 * @param delayTime
 * @param timeout
 * @param waitFor
 */
export async function waitForStack({ waitFor, delayTime = 1000, timeout = 10000 }: {
  waitFor: any,
  delayTime: number,
  timeout: number;
}) {
  const startTime = Date.now();
  while ((startTime + timeout) > Date.now()) {
    try {
      await waitFor();
      return;
    } catch (err) {
      await delay(delayTime);
    }
  }
  throw new TemandoError({
    status: '408',
    title: `AWS resource timeout of ${timeout} milliseconds exceeded.`,
    detail: `AWS resource timeout of ${timeout} milliseconds exceeded.`,
  });
}
