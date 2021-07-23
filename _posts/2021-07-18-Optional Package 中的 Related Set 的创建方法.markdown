---
layout: post
title:  "Optional Package 中的 Related Set 的创建方法"
date:   2021-07-18 19:30:48 +0800
categories: uwp
---

在 UWP 开发中，我们可以通过 Optional Package 来独立分发我们的资源文件、程序组件等内容。XBOX 游戏用到的 DLC，实际就是使用这项技术。它的好处多多，比如可以精简我们的主程序尺寸，实现插件系统，动态内容分发等。

在微软的官方文档中会提到一个叫做 Related Set 的概念，它利用一个文本文件来映射 Main Package 和 Optional Packae(OP) 之间的关系。但是实际上它并不是使用 OP 必备的条件，至少在我们本地开发中是这样。

如果需要实现如下功能，我们就需要定义我们自己的 Related Set：
* Main Package 和 Optional Package 之间需要版本关联
* Main Package 需要加载 Optional Package 中的代码（DLL）

针对其他情况，可以不使用 Related Set(至少本地调试是这样)：
* Main Package 需要加载 Optional Package 中的资源文件，比如图片，视频等

## 1.使用 Optional Pacakage 中的资源文件

如果 OP 只是用来承载资源文件，我们可以直接利用 VS 里面的 C# UWP Optional Package 工程模板来创建 OP 工程，然后把我们需要的资源文件添加到工程中，并且确保添加的文件的属性是"内容（Content）"。

在 OP 工程的 Package.Appxmanifest 文件中，要确保 MainPackageDependency 填写正确，它的值是 Main Package 的 Identity name，可以在 Main Package 的 Package.Appxmanifest 中找到它。 

    <Package>
  	    ...
	    <Dependencies>
    	    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.0.0" MaxVersionTested="10.0.0.0" />
    	    <uap3:MainPackageDependency Name="RelatedSetHostApp" />
  	    </Dependencies>
  	    ...
    </Package>

如果希望创建一个 C++ 的 OP 工程，可以直接创建 C++ 的 UWP 工程，然后手动修改 Package.Appxmanifest。

在 Main Package 中，我们使用 Windows.ApplicationModel.Package.Dependencies API 找到 OP，然后用 UWP 文件 API 读取资源文件即可。
    
    foreach (var item in Package.Current.Dependencies)
    {
	    if (item.IsOptional)
        {
    	    try
    	    {
    		    var textFile = await item.InstalledLocation.GetFileAsync("sample.txt");
        	    var ras = await textFile.OpenAsync(Windows.Storage.FileAccessMode.Read);
        	    StreamReader reader = new StreamReader(ras.AsStream());
    ......

## 2.使用 Optional Pacakage 中的(C++)代码

在 Main Pacakge 中可以通过 LoadPackagedLibrary 来加载 OP 中的 DLL, exe 等。但是经过实测发现，如果不创建 Related Set，LoadPackagedLibrary 就不能正常工作，会有找不到指定文件的错误提示。如下介绍两种 Related Set 创建方法。

### 1.在 Main Package 工程中添加 "Bundle.Mapping.txt" 文件

要确保文件名一定是 "Bundle.Mapping.txt" 并且文件属性是 "内容（Content）"，因为这样才能被正确识别。

    [OptionalProjects]
    "..\RelatedSetOptionalPackageCS\RelatedSetOptionalPackageCS.csproj"
    "..\RelatedSetOptionalPackageCPP\RelatedSetOptionalPackageCPP.vcxproj"

结构实际很简单，里面的文件路径是相对路径，指 OP 的工程文件相对于 Mapping 文件的路径。

接下来需要将 Main Package 工程的的 AppxBundle 方式配置成为 "Always"，如果 AppBundle 方式是 "Never", 那么在调试的时候 Related Set 并不能生效。

然后，就可以在 VS 中来调试我们的 Main Package 和 OP 了。重新编译整个工程的时候，我们能在 VS 的输出窗口看到 OP 的工程被编译了，即使之前并没有手动添加修改过 Main Pacakge 的 Build Depedency。

同样，如果需要用 VS 来创建 UWP 安装包（AppX, MSIX），Mapping 文件也一样有效，但是有两点需要注意：

1. 确保给 Main Pacakge 工程和 OP 工程都添加了PFX证书，因为没有被签名的 AppX 安装包是无法被本地安装的；
2. 确保创建 Main Package 的安装包时，选择的 App Bundle 方式是 Always，这样就能生成捆绑包（AppxBundle，MsixBundle），否则我们的 Related Set 就失效了

### 2.使用 MakeAppx.exe 手动创建 Related Set

可以先生成 Main Package 和 OP 的安装包，而且最好对安装包完成签名，VS 的 Publish 向导工具都可以帮助我们完成。

为了方便操作，我把所有文件放在一个统一的文件夹下面,（在我的示例工程中该文件夹为 MSIX）

    RelatedSetOptionalPackageCPP_1.0.0.0_x64_Debug.appxbundle		// 一个含有C++ 代码的OP安装包
    RelatedSetOptionalPackageCS_1.0.0.0_x64_Debug.msixbundle   		// 一个只有资源文件的OP安装包
    RelatedSetHostApp_1.0.2.0_x64_Debug.msix				// Main Package 安装包
    RelatedSetHostApp_TemporaryKey.pfx					// 最后签名用的证书

需要注意，我们用到的 Main Package 安装包一定是 MSIX 或者 AppX 格式，不能带有 Bundle 后缀，否则 MakeAppx.exe 不能处理。所以要求我们在生成 Main Pacakge 安装包时在 App Bundle 选项处选择 "Never"，如下图

![]({{url}}/Images/AppBundle.png)

在相同目录下创建Mapping.txt
   
    [Files]
    ".\RelatedSetHostApp_1.0.2.0_x64_Debug.msix"  "RelatedSetHostApp_1.0.2.0_x64_Debug.msix"

    [ExternalPackages]
    ".\RelatedSetOptionalPackageCPP_1.0.0.0_x64_Debug.appxbundle" "RelatedSetOptionalPackageCPP_1.0.0.0_x64_Debug.appxbundle"

    ".\RelatedSetOptionalPackageCS_1.0.0.0_x64_Debug.msixbundle" "RelatedSetOptionalPackageCS_1.0.0.0_x64_Debug.msixbundle"

注意，Files 下面指定 Main Package，ExternalPackages 下面指定我们需要的 OP.

每一个 AppX 或者 MSIX 用一行声明，第一个引号内容是 AppX 的相对位置，第二个引号内容是文件名称，两个引号内容中间是空格，不是换行！

准备好 Mapping.txt 文件后，就可以使用 MakeAppx.exe 创建带有 Related Set 信息的 Appx Bundle了，使用如下命令：

    "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\makeappx.exe" bundle /o /p my.appxbundle /f mapping.txt

注意,
* MakeAppx.exe 随 Windows SDK kit 分发，不同版本在不同目录；
* my.Appxbundle 是输出的安装包名称，里面只包含 Main Package 和用于定义 Related Set 的 XML 文件，OP 并不包含在里面，OP 需要单独手动安装

最后，一般还需要对 my.Appxbundle 签名，才能安装到用户机器。

    "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe" sign -f RelatedSetHostApp_TemporaryKey.pfx -fd SHA256 -v "my.appxbundle"

这样就生成了带有 Related Set 信息的安装包。

使用两种不同的方式添加 Related Set, 最终生成的安装包都是 Appxbundle 或者 msixbundle 这种捆绑包的形式。因为 Related Set 的关系被定义在一个叫做 AppxBundleManifest.xml 的文件中，这个文件被添加在 bundle 安装包的 AppxMetadata 目录下面。两种方法生成的 AppxBundleManifest 文件实际一样，如下：

    <?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <Bundle xmlns="http://schemas.microsoft.com/appx/2016/bundle" SchemaVersion="5.0" xmlns:b4="http://schemas.microsoft.com/appx/2018/bundle" xmlns:b5="http://schemas.microsoft.com/appx/2019/bundle" IgnorableNamespaces="b4 b5">
	    <Identity Name="RelatedSetHostApp" Publisher="CN=cjw11" Version="2021.718.1053.0"/>
	    <Packages>
		    <Package Type="application" Version="1.0.2.0" Architecture="x64" FileName="RelatedSetHostApp_1.0.2.0_x64_Debug.msix" Offset="70" Size="2621855">
			    <Resources>
				    <Resource Language="EN-US"/>
			    </Resources>
			    <b4:Dependencies>
				    <b4:TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.19041.0" MaxVersionTested="10.0.19041.0"/>
			    </b4:Dependencies>
		    </Package>
	    </Packages>
	    <OptionalBundle Name="RelatedSetOptionalPackageCPP" Publisher="CN=cjw11" Version="1.0.0.0" FileName="RelatedSetOptionalPackageCPP_1.0.0.0_x64_Debug.appxbundle">
		    <Package Type="application" Version="1.0.0.0" Architecture="x64" FileName="RelatedSetOptionalPackageCPP_1.0.0.0_x64_Debug.appx">
			    <Resources>
				    <Resource Language="EN-US"/>
				    <Resource Scale="200"/>
			    </Resources>
			    <b4:Dependencies>
				    <b4:TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.17134.0" MaxVersionTested="10.0.19041.0"/>
			    </b4:Dependencies>
	    	</Package>
	    </OptionalBundle>
	    <OptionalBundle Name="RelatedSetOptionalPackageCS" Publisher="CN=cjw11" Version="1.0.0.0" FileName="RelatedSetOptionalPackageCS_1.0.0.0_x64_Debug.msixbundle">
		    <Package Type="application" Version="1.0.0.0" Architecture="x64" FileName="RelatedSetOptionalPackageCS_1.0.0.0_x64_Debug.msix">
			    <Resources>
				<Resource Language="EN-US"/>
			    </Resources>
			    <b4:Dependencies>
			    	<b4:TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.19041.0" MaxVersionTested="10.0.19041.0"/>
			    </b4:Dependencies>
		    </Package>
	    </OptionalBundle>
    </Bundle>

在安装这个带有 AppxBundleManifest 文件的 Bundle 安装包时，该文件会被 AppInstaller 安装到用户机器，然后我们的 Main Package 在运行时，就可以根据这个文件找到需要的 OP，并且调用 OP 中的代码。

经过实际测试，这个文件被安装到如下目录：

    C:\ProgramData\Microsoft\Windows\AppRepository\RelatedSetHostApp_2021.718.1053.0_neutral_~_t4gwjwrg2sq8e.xml

其中的"2021.718.1053.0" 正是 AppxBundleManifest.xml 里面的版本号。

通过如上两种方式添加 Related Set 后，就可以在我们的 Main Package 中通过 LoadPacakgeLibrary API 加载 OP 中的 DLL。

## 本文示例代码
* [https://github.com/cjw1115/OptionalPacakge](https://github.com/cjw1115/OptionalPacakge)

## 参考文档
* [Tooling to create a Related Set](https://docs.microsoft.com/en-us/archive/blogs/Appinstaller/tooling-to-create-a-related-set)

* [https://github.com/AppInstaller/OptionalPackageSample](https://github.com/AppInstaller/OptionalPackageSample)
