using System;
using System.Threading.Tasks;
using Windows.Networking.BackgroundTransfer;
using Windows.Storage;
using Windows.UI.Notifications;
using Windows.Data.Xml.Dom;

public class DownloadManager
{
    public async Task StartDownloadAsync(Uri source, StorageFile destinationFile, string fileName)
    {
        BackgroundDownloader downloader = new BackgroundDownloader();
        DownloadOperation download = downloader.CreateDownload(source, destinationFile);

        // Iniciar la descarga
        await download.StartAsync().AsTask();

        // Al finalizar, disparar la notificación
        ShowToastNotification(fileName);
    }

    private void ShowToastNotification(string fileName)
    {
        ToastNotifier ToastNotifier = ToastNotificationManager.CreateToastNotifier();
        XmlDocument toastXml = ToastNotificationManager.GetTemplateContent(ToastTemplateType.ToastText02);
        
        XmlNodeList toastTextElements = toastXml.GetElementsByTagName("text");
        toastTextElements[0].AppendChild(toastXml.CreateTextNode("Descarga completa,El kiwi ya trajo la app a tu pc,disfruta"));
        toastTextElements[1].AppendChild(toastXml.CreateTextNode($"{fileName} se ha descargado correctamente,el kiwi te traera el instalador."));

        ToastNotification toast = new ToastNotification(toastXml);
        ToastNotifier.Show(toast);
    }
}