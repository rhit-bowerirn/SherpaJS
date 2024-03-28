/*
 *   Copyright (C) 2024 Sellers Industries, Inc.
 *   distributed under the MIT License
 *
 *   author: Evan Sellers <sellersew@gmail.com>
 *   date: Mon Mar 04 2024
 *   file: index.ts
 *   project: SherpaJS - Module Microservice Platform
 *   purpose: Source Code Utilities
 *
 */


import vm from "vm";
import fs from "fs";
import { BuildOptions } from "../../models.js";
import { Project as TSMorphProject } from "ts-morph";
import { build, BuildOptions as ESBuildOptions } from "esbuild";
import { TypeValidation, Schema } from "./ts-validation.js";
import { Files } from "../files/index.js";
import { Message } from "../logger/model.js";
import { EnvironmentVariables } from "../../models.js";
import { getEnvironmentVariables } from "./dot-env.js";


export const DEFAULT_ESBUILD_TARGET:Partial<ESBuildOptions> = {
    format: "cjs",
    target: "es2022",
    platform: "node",
    bundle: true,
    allowOverwrite: true,
    treeShaking: true,
    minify: true,
    footer: {
        js: "// Generated by SherpaJS"
    }
};


export class Tooling {


    static getExportedVariableNames(filepath:string):string[] {
        let project    = new TSMorphProject();
        let sourceFile = project.addSourceFileAtPath(filepath);
        return Array.from(sourceFile.getExportedDeclarations().keys());
    }


    static hasDefaultExport(filepath:string):boolean {
        let buffer = fs.readFileSync(filepath, "utf8");
        return buffer.match(/export\s+default\s+/) != null;
    } 


    static async getDefaultExport(filepath:string):Promise<unknown> {
        let result = await build({
            ...DEFAULT_ESBUILD_TARGET,
            entryPoints: [filepath],
            write: false
        });

        let code    = result.outputFiles[0].text;
        let context = vm.createContext({ process, module: { exports: {} }});
        vm.runInContext(code, context);
        return context.module.exports.default;
    }


    static async build(props:{ buffer:string, output:string, resolve?:string, options?:BuildOptions, esbuild?:Partial<ESBuildOptions> }) {
        await build({
            ...DEFAULT_ESBUILD_TARGET,
            ...props.options?.developer?.bundler?.esbuild,
            ...props.esbuild,
            stdin: {
                contents: props.buffer,
                resolveDir: props.resolve,
                loader: "ts",
            },
            outfile: props.output,
            define: this.getESBuildEnvironmentVariables(props.options)
        });
    }


    private static getESBuildEnvironmentVariables(options:BuildOptions):{ [key:string]:string } {
        let variables = this.getEnvironmentVariables(options);
        return { "process.env": JSON.stringify(variables) };
    }


    static getEnvironmentVariables(options:BuildOptions):EnvironmentVariables {
        return getEnvironmentVariables(options);
    }


    static typeCheck(filepath:string, fileTypeName:string, functionName:string, schema:Schema):Message[] {
        return new TypeValidation(filepath, fileTypeName, functionName, schema).apply();
    }


    public static resolve(path:string, resolveDir:string=""):string|null {
        let local = Files.join(resolveDir, path);
        let npm   = Files.join(resolveDir, "../../../node_modules", path);
        if (Files.exists(local)) {
            return local;
        }
        if (Files.exists(npm)) {
            return npm;
        }
        return null;
    }


}


// Whoever believes and is baptized will be saved, but whoever does not
// believe will be condemned.
// - Mark 16:16
