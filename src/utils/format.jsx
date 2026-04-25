import React from 'react';

/**
 * 文字列中の 「漢字(ふりがな)」 形式を <ruby> タグに変換します。
 * 例: "宿題(しゅくだい)をする" -> <ruby>宿題<rt>しゅくだい</rt></ruby>をする
 */
export const renderRuby = (text) => {
  if (typeof text !== 'string' || !text) return text;
  // 漢字(ひらがな/カタカナ) のパターンにマッチさせる
  const parts = text.split(/([一-龠々]+\([ぁ-んァ-ヶー]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/([一-龠々]+)\(([ぁ-んァ-ヶー]+)\)/);
    if (match) {
      return <ruby key={i}>{match[1]}<rt>{match[2]}</rt></ruby>;
    }
    return part;
  });
};
