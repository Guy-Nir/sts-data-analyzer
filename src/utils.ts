import { unzip } from "un-gzip";
import { dataFilesDir } from ".";

export const unzipRun = async (fileName: string) => {
    const name = `${dataFilesDir}/${fileName}`;
    const newName = `${dataFilesDir}/${fileName}.unzipped`;

    return new Promise<string>((res, _rej) => {
        unzip(name, newName, () => {
            res(newName);
        });
    })
}

export const sortObject = <RawData>(obj: Record<string, RawData>, quantifier: (data: RawData) => number, formatter: (data: RawData) => object) => {
    const arr = [];

    for (let key in obj) {
        const dataPoint = obj[key];

        arr.push(dataPoint);
    }

    arr.sort((a, b) => quantifier(a) - quantifier(b));

    return arr.map(formatter);
}
