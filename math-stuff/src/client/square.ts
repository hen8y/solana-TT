import * as borsh from 'borsh';
import * as math from './math';


class MathStuffSquare
{
    sum = 0;
    constructor(fields: {sum: number} | undefined = undefined) {
        if (fields) {
            this.sum = fields.sum;
        }
    }
}

const MathStuffSumSchema = new Map([
    [MathStuffSquare, {kind: 'struct', fields: [['square', 'u32']]}]
]);

const MATH_STUFF_SIZE = borsh.serialize(
    MathStuffSumSchema,
    new MathStuffSquare()
).length;


async function main()
{
    await math.example('square', MATH_STUFF_SIZE);
}

main().then(
    () => process.exit(),
        err => {
        console.error(err);
        process.exit(-1);
    },
);

