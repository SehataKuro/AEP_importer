// MANATO JOKO

// v1.2 2024/11/16
// 尺を選択したレイヤーに合わせるように修正
// ctrl+zで元に戻せるように修正

// フォルダのパスを設定
var scriptFile = new File($.fileName); // スクリプトファイルのパスを取得
var scriptFolder = scriptFile.parent; // スクリプトファイルの親フォルダを取得
var folderPath = scriptFolder.fsName + "/AEP"; // データフォルダのパスを構築


try 
{
    function replaceLayerComp(fullPath) {
        // アクティブなプロジェクト、コンポジション、レイヤーを取得
        var proj = app.project;
        var activeComp = proj.activeItem;
        if (activeComp == null || !(activeComp instanceof CompItem)) {
            alert("アクティブなコンポジションが見つかりません。");
            return;
        }

        // 選択されたレイヤーを取得
        var selectedLayers = activeComp.selectedLayers;
        if (selectedLayers.length == 0) {
            alert("レイヤーが選択されていません。");
            return;
        }
        var selectedLayer = selectedLayers[0];
        var selectedLayerName = selectedLayer.name;

        // 
        var importOptions = new ImportOptions(File(fullPath));
        var importedProj = app.project.importFile(importOptions);


        // スクリプトの処理を開始
        app.beginUndoGroup("AEP_importer"); 

        // インポートしたフォルダにあるコンポジションをすべて検索する
        CompItems = []
        FolderItems = []
        // フォルダを検索
        for (var i = 1; i <= importedProj.items.length; i++) {
            if (importedProj.items[i] instanceof CompItem) {
                CompItems.push(importedProj.items[i]);
            }
        }
        // インポートしたフォルダにあるフォルダをすべて検索する
        for (var i = 1; i <= importedProj.items.length; i++) {
            if (importedProj.items[i] instanceof FolderItem) {
                FolderItems.push(importedProj.items[i]);
            }
        }
        // フォルダ内のコンポジションを検索
        for (var i = 0; i < FolderItems.length; i++) {
            for (var j = 1; j <= FolderItems[i].items.length; j++) {
                if (FolderItems[i].items[j] instanceof CompItem) {
                    CompItems.push(FolderItems[i].items[j]);
                }
            }
        }
        
        //コンポジションをリサイズ
        // 選択したレイヤーのアイテムのサイズを取得
        var layw = selectedLayer.width;
        var layh = selectedLayer.height;
        // 選択したレイヤーの尺を取得
        var laydur = selectedLayer.outPoint - selectedLayer.inPoint;

        for (var i = 0; i < CompItems.length; i++) {
            // コンポジションのリサイズ
            CompItems[i].width = layw;
            CompItems[i].height = layh;

            // コンポジションの尺を変更
            CompItems[i].duration = laydur;

            // レイヤーの位置を変更
            for (var j = 1; j <= CompItems[i].layers.length; j++) {
                CompItems[i].layer(j).position.setValue([layw / 2, layh / 2]);
            }
        }



        // インポートされた「routinework.aep」フォルダーの「IN」と「OUT」コンポを検索
        var INComp = null;
        var OUTComp = null;
        for (var i = 1; i <= importedProj.items.length; i++) {
            if (importedProj.items[i] instanceof CompItem) {
                if (importedProj.items[i].name == "IN") {
                    INComp = importedProj.items[i];
                } else if (importedProj.items[i].name == "OUT") {
                    OUTComp = importedProj.items[i];
                }
            }
        }

        if (INComp == null) {
            alert("INコンポジションが見つかりません。");
            return;
        }

        if (OUTComp == null) {
            alert("OUTコンポジションが見つかりません。");
            return;
        }

        // INコンポジションに選択したレイヤーを追加する
        var newLayer = INComp.layers.add(selectedLayer.source);

        // 選択したレイヤーのソースをOUTコンポジションに差し替える
        selectedLayer.replaceSource(OUTComp, false);

        // OUTコンポジションをリネーム
        var importedProjName = importedProj.name;
        OUTComp.name = selectedLayerName + "_Fx" ;

        // インポートしたフォルダ名をリネーム
        importedProj.name = selectedLayerName + "_Fx" ;

        // 選択したレイヤーのラベル色を変更
        selectedLayer.label = 15;

            
        // スクリプトの処理を終了
        app.endUndoGroup();
    }

    function displayAEPFilesInListBox() {
        var folder = new Folder(folderPath);
        if (!folder.exists) {
            alert("指定されたフォルダが存在しません。");
            return null;
        }
    
        // .aepファイルを取得
        var files = folder.getFiles("*.aep");
        var fileNames = [];
    
        for (var i = 0; i < files.length; i++) {
            fileNames.push(files[i].displayName); // ファイル名をそのまま使用
        }
    
        // ダイアログボックスを作成
        var dlg = new Window("dialog", "AEPファイルリスト");
        dlg.orientation = "column";
    
        // リストボックスを作成
        var listBox = dlg.add("listbox", undefined, fileNames, {multiselect: false});
        listBox.preferredSize = [300, 150];
    
        // OKボタンを追加
        var btnOK = dlg.add("button", undefined, "OK", {name: "ok"});
        
        var selectedFileName = null;
    
        // OKボタンがクリックされたときの処理
        btnOK.onClick = function() {
            if (listBox.selection) {
                selectedFileName = listBox.selection.text;
            }
            dlg.close();
        };
    
        // ダイアログを表示
        dlg.center();
        dlg.show();
    
        // ダイアログが閉じた後にフルパスを返す
        if (selectedFileName) {
            return folderPath + "/" + selectedFileName;
        } else {
            return null;
        }
    }    


    // 使用するフォルダのパスを指定
    var fullPath = displayAEPFilesInListBox(folderPath);

    replaceLayerComp(fullPath);

}catch (e) {
    alert("エラーが発生しました：" + e.toString());
}

