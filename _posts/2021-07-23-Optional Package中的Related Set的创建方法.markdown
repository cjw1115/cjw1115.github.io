---
layout: post
title:  "Optional Package中的Related Set的创建方法"
date:   2021-07-23 12:20:59 +0800
categories: UWP
---

在UWP开发中，我们可以通过Optional Package来独立分发我们的资源文件，程序组件等内容。XBOX里面的游戏用到的DLC，实际就是使用这项技术。总之它的好处多多，比如可以精简化我们的主程序尺寸，实现插件系统，动态内容分发等。

在微软的官方文档中会提到一个叫做Related Set的概念，它利用一个文本文件来映射Main Package和Optional Packae(OP)之间的关系。但是实际上它并不是使用OP必备的条件，至少在我们本地开发中是这样。

如果需要实现如下功能，我们就需要定义我们自己的Related Set：
* Main Package和Optional Package之间需要版本关联
* Main Package 需要加载Optional Package 中的代码（DLL）

其他下情况下，则并不需要定义Related Set(至少本地调试是这样)：
* Main Package 需要加载 Optional Package 中的资源文件，比如图片，视频等

## 1.使用Optional Pacakage中的资源文件

如果OP只是用来承载资源文件，我们可以直接利用VS里面的C# UWP Optional Package工程模板来创建OP工程，然后把我们需要的资源文件添加到工程中，并且确保添加的文件的属性是"内容（Content）"。

在OP工程的Package.Appxmanifest文件中，要确保MainPackageDependency填写正确，是Main Package的Identity name.

    <Package>
  	    ...
	    <Dependencies>
    	    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.0.0" MaxVersionTested="10.0.0.0" />
    	    <uap3:MainPackageDependency Name="RelatedSetHostApp" />
  	    </Dependencies>
  	    ...
    </Package>

如果希望创建一个C++ 的OP 工程，可以直接创建 C++ 的UWP工程，然后手动修改Package.Appxmanifest。

在Main Package中，我们使用Windows.ApplicationModel.Package.Dependencies API 找到OP，然后用 UWP 文件API读取资源文件即可。
    
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

## 2.使用Optional Pacakage中的(C++)代码

在Main Pacakge中可以通过LoadPackagedLibrary来加载 OP中的DLL,exe等。但是经过实测发现，如果不创建Related Set，LoadPackagedLibrary就不能正常工作，会有找不到指定文件的错误提示。如下介绍两种Related Set创建方法。

### 1.在Main Package工程中添加 ”Bundle.MApping.txt“ 文件

要确保文件名一定是 ”Bundle.MApping.txt“ 并且文件属性是 ”内容（Content）“，因为这样才能被正确识别。

    [OptionalProjects]
    "..\RelatedSetOptionalPackageCS\RelatedSetOptionalPackageCS.csproj"
    "..\RelatedSetOptionalPackageCPP\RelatedSetOptionalPackageCPP.vcxproj"

结构实际很简单，里面的文件路径是相对路径，指OP的工程文件相对于MApping文件的路径。

创建完MApping文件后，就可以在VS中来调试我们的Main Package 和OP了。重新编译整个工程的时候，我们能在VS的输出窗口看到OP的工程也被编译了，即使之前并没有手动添加修改过Main Pacakge的Build Depedency.

同样，如果需要用VS来创建UWP安装包（AppX,MSIX），mApping文件也一样有效，但是有两点需要注意：

1. 确保给Main Pacakge工程和 OP 工程都添加了PFX证书，因为没有被签名的AppX安装包是无法被本地安装的；
2. 确保在创建Main Package 的安装包时，选择的App Bundle方式是Always，这样就能生成捆绑包（AppxBundle，MsixBundle），否则我们的Related Set就失效了

### 2.使用MakeAppx.exe手动创建Related Set

可以先生成Main Package 和OP的安装包，而且最好对安装包完成签名，不过这些VS的Publish向导工具都可以帮助我们完成。

为了方便，我把需要用到的所有文件放在一个统一的文件夹下面,（在我的Sample工程中该文件夹为MSIX）

    RelatedSetOptionalPackageCPP_1.0.0.0_x64_Debug.appxbundle  // 一个含有C++ 代码的OP安装包
    RelatedSetOptionalPackageCS_1.0.0.0_x64_Debug.msixbundle   // 一个只有资源文件的OP安装包
    RelatedSetHostApp_1.0.2.0_x64_Debug.msix				   // Main Package 安装包
    RelatedSetHostApp_TemporaryKey.pfx						   // 最后签名用的证书

需要注意，我们用到的Main Package安装包一定是MSIX或者AppX格式，不能带有Bundle后缀，否则MakeAppx.exe不能处理。所以要求我们在生成Main Pacakge安装包时在App Bundle选项处选择 ”Never“，如下图

![]({{url}}/images/appbundle.png)

在相同目录下创建mApping.txt
   
    [Files]
    ".\RelatedSetHostApp_1.0.2.0_x64_Debug.msix"  "RelatedSetHostApp_1.0.2.0_x64_Debug.msix"

    [ExternalPackages]
    ".\RelatedSetOptionalPackageCPP_1.0.0.0_x64_Debug.appxbundle" "RelatedSetOptionalPackageCPP_1.0.0.0_x64_Debug.appxbundle"

    ".\RelatedSetOptionalPackageCS_1.0.0.0_x64_Debug.msixbundle" "RelatedSetOptionalPackageCS_1.0.0.0_x64_Debug.msixbundle"

注意，Files下面指定Main Package，ExternalPackages下面指定我们需要的OP.

每一个AppX或者MSIX用一行声明，第一个引号内容是AppX的相对位置，第二个引号内容是文件名称，两个引号内容中间是空格，不是换行！

准备好mApping.txt文件后，就可以使用MakeAppx.exe创建带有Related Set信息的Appx Bundle了，使用如下命令：

    "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\makeappx.exe" bundle /o /p my.appxbundle /f mapping.txt

注意,
* makeAppx.exe随Windows SDK KIT 分发，不同版本在不同目录;
* my.Appxbundle是输出的安装包名称，里面只包含Main Package和用于定义Related Set的XML文件，OP并不包含在里面，使用OP时需要单独安装

最后，一般还需要对my.Appxbundle签名，才能安装到用户机器。

    "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe" sign -f RelatedSetHostApp_TemporaryKey.pfx -fd SHA256 -v "my.appxbundle"

这样就生成了带有Related Set信息的安装包。

使用两种不同的方式添加Related Set, 最终生成的安装包都是Appxbundle或者msixbundle这种捆绑包的形式。因为Related Set的关系被定义在一个叫做AppxBundleManifest.xml 的文件中，这个文件被添加在bundle安装包的的AppxMetadata目录下面。两种方法生成的 AppxBundleManifest 文件实际一样，如下：

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

在安装这个带有AppxBundleManifest文件的Bundle安装包时，该文件会被AppInstaller安装到用户机器，然后我们的Main Packae在运行时，就可以根据这个文件找到需要的OP，并且调用OP中的代码。

经过我的实际测试，这个文件会被安装到如下目录：

    C:\ProgramData\Microsoft\Windows\AppRepository\RelatedSetHostApp_2021.718.1053.0_neutral_~_t4gwjwrg2sq8e.xml

其中的”2021.718.1053.0“ 正是 AppxBundleManifest.xml里面的版本号。

通过如上两种方式添加Related Set后，就可以在我们的Main Pacakge中通过 LoadPacakgeLibrary API 加载OP中的DLL了。

## 本文示例代码
* [https://github.com/cjw1115/OptionalPacakge](https://github.com/cjw1115/OptionalPacakge)

## 参考文档
* [Tooling to create a Related Set](https://docs.microsoft.com/en-us/archive/blogs/Appinstaller/tooling-to-create-a-related-set)

* [https://github.com/AppInstaller/OptionalPackageSample](https://github.com/AppInstaller/OptionalPackageSample)
