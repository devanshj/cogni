import { TestScheduler } from "rxjs/testing";
import { RunHelpers } from "rxjs/internal/testing/TestScheduler";

export const createScheduler = () => {
    const scheduler = new TestScheduler((a, b) => expect(a).toStrictEqual(b));

    return (test: (helpers: RunHelpers & { time: typeof scheduler.createTime }) => void) => {
        scheduler.run(helpers => {
            test({
                ...helpers,
                time: (marbles: string) => {
                    marbles = marbles.trim();
                    return scheduler.createTime(marbles);
                }
            })
        })
    }
}