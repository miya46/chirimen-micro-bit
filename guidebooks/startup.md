# スタートアップガイド
 
## 概要
CHIRIMEN with micro:bitをはじめてつかうときの流れを解説します。
 
## 準備するもの
- Bluetooth (4.0以上) が載ったコンピュータ ＋ Web Bluetooth APIをサポートしたブラウザ
   - ( Windows10 PC | MacOS PC | Linux PC ) ＋ ( Chrome | Chromium )
   - Rasoberry Pi3 + Chromium ([Chirimen for Raspberry Pi3](https://tutorial.chirimen.org/raspi3/ja/sdcard)は、CHIRIMEN with micro:bit用としても使える環境設定済みのOSイメージになっています。raspbianで自分で設定して使うこともできます)
   - Windowsマシン + [blinkエンジン搭載のEdge(現在Devリリース)](https://www.microsoftedgeinsider.com)
   - Bluetoothが載っていないPCでもBluetooth USBドングルで使えるものがあります。(Windows10マシン+エレコムLBT-UAN05C2など)
- micro:bit (amazonなどで購入可能です。2000円程))
- microUSBケーブル(PCとmicro:bitを繋いでプログラムを書き込むために必要)
- micro:bit用ブレークアウトボード （micro:bitのエッジ端子をピンヘッダに変換するパーツ 下記に例を紹介します　数百円～）
   - http://akizukidenshi.com/catalog/g/gP-12836/
   - https://www.switch-science.com/catalog/3181/
   - https://www.amazon.co.jp/dp/B07QGZ3DKK
   - https://www.amazon.co.jp/dp/B07GTQ21ST
- Examplesに応じたパーツやジャンパー線
   - CHIRIMENスターターキットを使うと、GPIOおよび、I2C(温度センサ)のExamplesが試せます
   - Lチカに必要なパーツは以下を参照してください

### L チカに必要となるパーツ
- ブレッドボード × 1
- リード付き LED × 1
- リード付き抵抗器 (150Ω-1KΩ) × 1 (赤色のものは大きい抵抗値でも点灯するでしょう)
- ジャンパーワイヤー (オス-メス) x 2

### micro:bitのピンのことを知る
micro:bitにはGPIO等の端子が備わっていますが、ブレッドボードを接続するのに便利なピンヘッダではなく、少し独特な[エッジコネクタ](https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%83%E3%82%B8%E3%83%BB%E3%82%B3%E3%83%8D%E3%82%AF%E3%82%BF)になっています。
![micro:bit](https://pxt.azureedge.net/blob/64c6ccff8e3ee82c4224874e5cacc9d0d5c60132/static/mb/device/pins-0.png) 
オリジナルページ：https://makecode.microbit.org/device/pins