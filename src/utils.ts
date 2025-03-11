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

export const sortObject = <RawData, FormattedData>(obj: Record<string, RawData>, quantifier: (data: RawData) => number, formatter: (key: string, data: RawData) => FormattedData): FormattedData[] => {
    const arr = [];

    for (let key in obj) {
        const data = obj[key];

        arr.push({ key, data: data });
    }

    arr.sort(({ data: a }, { data: b }) => quantifier(a) - quantifier(b));

    return arr.map(({ key, data }) => formatter(key, data));
}
