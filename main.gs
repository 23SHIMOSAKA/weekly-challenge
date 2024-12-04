const GEMINI_API = "{GeminiのAPIキーを入れてね}"

function getWeekRange() {
  const today = new Date();

  const startOfNextWeek = new Date(today); // 実行日の次の日から開始
  startOfNextWeek.setDate(today.getDate() + 1); // 翌日を取得

  // 次の週の始まり（月曜日）を計算
  const dayOfWeek = startOfNextWeek.getDay(); // 0(日) - 6(土)
  const daysUntilMonday = (8 - dayOfWeek) % 7; // 次の月曜日までの日数

  startOfNextWeek.setDate(startOfNextWeek.getDate() + daysUntilMonday);

  // 1週間後の日曜日を取得
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

  const startDate = Utilities.formatDate(startOfNextWeek, Session.getScriptTimeZone(), "MM/dd");
  const endDate = Utilities.formatDate(endOfNextWeek, Session.getScriptTimeZone(), "MM/dd");

  console.log('(' + startDate + "~" + endDate + ')')

  return {
    start: startDate,
    end: endDate
  }
}

function getTheme(weekRange) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API}`
        , payload = {
            'contents': [
              {
                'parts': [{
                  'text': 'あなたはクリエイティブなテーマのキーワードを提案する役割を担っています。今週(' + weekRange.start + '~' + weekRange.end + ')の季節や行事に基づいたテーマのキーワードを3つ提案します。更に、完全にランダムなお題を1つ提案します。以下のフォーマットでJSON形式で返してください。{ "weekTheme": ["キーワード1", "キーワード2", "キーワード3"], "randomTheme": ["キーワード4"] }. それぞれのキーワードはインスピレーションを刺激するものである必要があります。例えば冬の場合、テーマに沿ったキーワードには「雪景色」「おでん」などが考えられ、ランダムなお題には「見つけて良かったもの」「食べて美味しかったもの」など、季節や行事に関係ない、抽象的なテーマが含まれます。今週に合ったキーワードとランダムなお題を選んでください。'
                }]
              }
            ]
          }
        , options = {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify(payload)
          };

  const res = UrlFetchApp.fetch(url, options)
        , resJson = JSON.parse(res.getContentText());

  console.log(JSON.stringify(resJson));

  contents = ''
  let parsedContents;

  if (resJson && resJson.candidates && resJson.candidates.length > 0) {
    contents = resJson.candidates[0].content.parts[0].text;
    contents = contents.replace(/^```json\s*/, '').replace(/```$/, '');

    try {
      parsedContents = JSON.parse(contents);
    } catch (error) {
      // JSONのパースに失敗した場合
      Logger.log("JSON parsing error: " + error);
      parsedContents = { weekTheme: ["何らかのエラーが発生したよ_(:3」∠)_"] };
    }
  } else {
    // HARM_CATEGORYによって、無回答の場合も多々あり
    parsedContents = { weekTheme: ["何らかのエラーが発生したよ_(:3」∠)_"] };
  }

  // 新しいJSONの生成
  const newJson = {
    theme: parsedContents.weekTheme || [], // weekThemeが存在しない場合は空配列
    random: parsedContents.randomTheme || [],
    available: parsedContents.weekTheme && parsedContents.weekTheme.length > 1 ? "true" : "false",
    start: weekRange.start,
    end: weekRange.end,
  };

  return newJson
}

function createContents(json) {
  try {
    weekly_theme = json.theme
    random_theme = json.random
    start = json.start
    end = json.end

    embeds = {
      "title": "📢 今週のお題 ✨",
      "description": `${start}〜${end}\n+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-+:-+:-+:-+:-+\n\n## 📅 テーマ\n- ${weekly_theme[0]}\n- ${weekly_theme[1]}\n- ${weekly_theme[2]}\n## ❓ランダムお題\n- ${random_theme[0]}\n\n+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-:+:-+:-+:-+:-+:-+`,
      "color": "16766720",
      "footer": {
        "text": "週間チャレンジお代告知bot（試験運用中）",
        "icon_url": "{URL入れてね}"
      }
    } 
  } catch(error){
    Logger.log(error)

    embeds = {
      "title": "エラーっぽいよ",
      "description":"どっかでエラーが出たっぽいよ",
      "color": "16766720",
      "footer": {
        "text": "週間チャレンジお代告知bot（試験運用中）",
        "icon_url": "{URL入れてね}"
      }
    }
  }
    
    return embeds
}

function postWebhook(contents) {
  // WebhookのURL
  var webhookUrl = '{URL入れてね}';
  // 送信するデータ
  var payload = {
    'content': 'お題を告知するよ！',
    'embeds' : [contents],
  };
  
  // リクエストのオプション設定
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };
  
  // WebhookにPOSTリクエストを送信
  UrlFetchApp.fetch(webhookUrl, options);
}

function main() {
  weekRange = getWeekRange() //来週一週間の開始日・終了日を取得

  theme = getTheme(weekRange) // 日付に基づいてテーマを取得

  contents = createContents(theme)
  console.log(contents)

  postWebhook(contents) //内容をwebhook経由で送信
}