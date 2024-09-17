import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
    SystemProgram,
} from '@solana/web3.js';
import fs from 'mz/fs';
import os from 'os';
import yaml from 'yaml';
import path from 'path';
import { createKeyPairFromFile } from './util';

const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    '.config',
    'solana',
    'cli',
    'config.yml'
);

let connection: Connection;
let localKeypair: Keypair;
let programKeypair: Keypair;
let programId: PublicKey;
let clientPubKey: PublicKey;

const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program')


export async function connect()
{
    connection = new Connection('https://api.testnet.solana.com', 'confirmed');

    console.log("Connection successful");
}


export async function getLocalAccount()
{
    const configYml = await fs.readFile(CONFIG_FILE_PATH, {encoding: 'utf8'});
    const keypairPath = await yaml.parse(configYml).keypair_path;
    localKeypair = await createKeyPairFromFile(keypairPath);

    const airdropRequest = await connection.requestAirdrop(
        localKeypair.publicKey,
        LAMPORTS_PER_SOL
    )
    await connection.confirmTransaction(airdropRequest);

    console.log(`Local account loaded successfully.`);
    console.log(`Local account's address is:`);
    console.log(`   ${localKeypair.publicKey}`);
}


export async function getProgram(programName: string)
{
    programKeypair = await createKeyPairFromFile(path.join(PROGRAM_PATH, programName + '-keypair.json'));

    programId = programKeypair.publicKey;

    console.log(`We're going to ping the ${programName} program.`);
    console.log(`It's Program ID is:`);
    console.log(`   ${programId.toBase58()}`)
}

export async function configureClientAccount(accountSpaceSize: number)
{
    const SEED = 'test2';
    clientPubKey = await PublicKey.createWithSeed(
        localKeypair.publicKey,
        SEED,
        programId,
    );
    console.log(`For simplicity's sake, we've created an address using a seed.`);
    console.log(`That seed is just the string "test(num)".`);
    console.log(`The generated address is:`);
    console.log(`   ${clientPubKey.toBase58()}`);

    const clientAccount = await connection.getAccountInfo(clientPubKey);

    if (clientAccount === null) {
        console.log(`Looks like that account does not exist. Let's create it.`);

        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: localKeypair.publicKey,
                basePubkey: localKeypair.publicKey,
                seed: SEED,
                newAccountPubkey: clientPubKey,
                lamports: LAMPORTS_PER_SOL,
                space: accountSpaceSize,
                programId
            }),
        );

        await sendAndConfirmTransaction(connection, transaction, [localKeypair]);
        console.log(`Client account created successfully.`);
    } else {
        console.log(`Looks like that account exists already. We can just use it.`);
    }
}

export async function pingProgram(programName: string)
{
    console.log(`All right, let's run it.`);
    console.log(`Pinging ${programName} program...`);

    const instruction = new TransactionInstruction ({
        keys: [{pubkey: clientPubKey, isSigner: false, isWritable: true}],
        programId,
        data: Buffer.alloc(0),
    });

    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [localKeypair],
    );

    console.log('Ping Successfull');
}

export async function example(programName: string, accountSpaceSize: number)
{
    await connect();
    await getLocalAccount();
    await getProgram(programName);
    await configureClientAccount(accountSpaceSize);
    await pingProgram(programName);
}
