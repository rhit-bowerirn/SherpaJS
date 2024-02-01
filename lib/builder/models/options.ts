import { BuildOptions as ESBuildOptions } from "esbuild";


export enum BundlerType {
    Vercel = "Vercel",
    ExpressJS = "ExpressJS",
}


export type BuildOptions = {
    input:string;
    output:string;
    bundler:BundlerType;
    developer?:{
        bundler?:{
            esbuild?:Partial<ESBuildOptions>;
        }
    }
}

