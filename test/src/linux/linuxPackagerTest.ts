import { modifyPackageJson, app, appThrows } from "../helpers/packTester"
import { remove, readFile, rename } from "fs-extra-p"
import * as path from "path"
import { Platform, build } from "electron-builder"
import { assertThat } from "../helpers/fileAssert"

test.ifDevOrLinuxCi("AppImage", app({targets: Platform.LINUX.createTarget()}))

test.ifDevOrLinuxCi("AppImage - default icon, custom executable and custom desktop", app({
  targets: Platform.LINUX.createTarget("appimage"),
  effectiveOptionComputed: async (it) => {
    const content = await readFile(it[1], "utf-8")
    expect(content.includes("Foo=bar")).toBeTruthy()
    expect(content.includes("Terminal=true")).toBeTruthy()
    return false
  },
  config: {
    linux: {
      executableName: "foo",
      desktop: {
        Foo: "bar",
        Terminal: "true",
      },
    }
  }
}, {
  projectDirCreated: it => remove(path.join(it, "build")),
}))

test.ifNotWindows("icons from ICNS", app({targets: Platform.LINUX.createTarget()}, {
  projectDirCreated: it => remove(path.join(it, "build", "icons")),
  packed: async context => {
    // test https://github.com/electron-userland/electron-builder/issues/1102
    const projectDir = context.getResources(Platform.LINUX)

    await rename(path.join(projectDir, "electron.asar"), path.join(projectDir, "someAsarFile.asar"))

    await build({
      targets: Platform.LINUX.createTarget(),
      projectDir: projectDir,
    })

    await assertThat(path.join(projectDir, "dist")).isDirectory()
    await assertThat(path.join(projectDir, "dist", "linux-unpacked", "resources", "someAsarFile.asar")).isFile()
  },
}))

test.ifNotWindows("no-author-email", appThrows(/Please specify author 'email' in .+/, {targets: Platform.LINUX.createTarget("deb")}, {
  projectDirCreated: projectDir => modifyPackageJson(projectDir, data => {
    data.author = "Foo"
  })
}))