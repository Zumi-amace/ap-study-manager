import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import {
  extractProblemFromDocument,
  normalizeText,
  SELECTOR_ERROR_MESSAGE
} from './selectors';

function documentFrom(html: string): Document {
  return new JSDOM(html).window.document;
}

describe('extractProblemFromDocument', () => {
  it('PC版の問題文と選択肢を取得して整形する', () => {
    const documentRef = documentFrom(`
      <main id="mainCol">
        <div class="main kako"><h2>応用情報技術者令和7年春期 午前 問1</h2>
          <h3 class="qno">問1<div id="calcBtn"></div></h3>
          <div id="mondai">論理式P，Qがいずれも真であるとき，論理式Rの真偽にかかわらず真になる式はどれか。</div>
          <div class="ansbg" style="margin:10px 0 50px">
            <ul class="selectList col1">
              <li><button class="selectBtn">ア</button><span id="select_a">((P→Q)∧(Q→P))→(R→Q)</span></li>
              <li><button class="selectBtn">イ</button><span id="select_i">((P→Q)∧(Q→P))→(Q→R)</span></li>
              <li><button class="selectBtn">ウ</button><span id="select_u">((P→Q)∨(Q→P))→(R→Q)</span></li>
              <li><button class="selectBtn" id="t">エ</button><span id="select_e">((P→Q)∨(Q→P))→(Q→R)</span></li>
            </ul>
          </div>
          <div id="ans"></div>
        </div>
      </main>
    `);

    expect(extractProblemFromDocument(documentRef)).toBe(
      '問題文:\n論理式P，Qがいずれも真であるとき，論理式Rの真偽にかかわらず真になる式はどれか。\n\n選択肢:\nア ((P→Q)∧(Q→P))→(R→Q)\nイ ((P→Q)∧(Q→P))→(Q→R)\nウ ((P→Q)∨(Q→P))→(R→Q)\nエ ((P→Q)∨(Q→P))→(Q→R)'
    );
  });

  it('モバイル版の問題文と選択肢を取得する', () => {
    const documentRef = documentFrom(`
      <div id="qPage" class="qPage">
        <section class="roundBox">
          <div class="big">問1<a href="javascript:void(0)" class="toAPage arrowBtn">解説へ</a><div id="calcBtn"><i class="calc"></i></div></div>
          <div class="sentence" id="mondai">論理式P，Qがいずれも真であるとき，論理式Rの真偽にかかわらず真になる式はどれか。</div>
          <p class="grayText"></p>
        </section><section class="roundBox"><ul class="selectList">
          <li>((P→Q)∧(Q→P))→(R→Q)</li>
          <li>((P→Q)∧(Q→P))→(Q→R)</li>
          <li>((P→Q)∨(Q→P))→(R→Q)</li>
          <li>((P→Q)∨(Q→P))→(Q→R)</li>
        </ul></section>
        <ul class="selectBtn"><li><a href="javascript:void(0)">ア</a></li><li><a href="javascript:void(0)">イ</a></li></ul>
      </div>
    `);

    expect(extractProblemFromDocument(documentRef)).toContain(
      'ア ((P→Q)∧(Q→P))→(R→Q)\nイ ((P→Q)∧(Q→P))→(Q→R)\nウ ((P→Q)∨(Q→P))→(R→Q)\nエ ((P→Q)∨(Q→P))→(Q→R)'
    );
  });

  it('全角・改行を含む本文と選択肢を1行に正規化する', () => {
    const documentRef = documentFrom(`
      <div class="main kako">
        <div id="mondai">
          複数行の
          問題文　です。
        </div>
        <div class="ansbg">
          <ul class="selectList">
            <li><span id="select_a">選択肢
            A</span></li>
            <li><span id="select_i">選択肢 B</span></li>
          </ul>
        </div>
      </div>
    `);

    expect(extractProblemFromDocument(documentRef)).toBe(
      '問題文:\n複数行の 問題文 です。\n\n選択肢:\nア 選択肢 A\nイ 選択肢 B'
    );
  });

  it('問題文がない場合は明示エラーを投げる', () => {
    const documentRef = documentFrom(`
      <div class="main kako">
        <div class="ansbg"><ul class="selectList"><li>ア</li><li>イ</li></ul></div>
      </div>
    `);

    expect(() => extractProblemFromDocument(documentRef)).toThrow(SELECTOR_ERROR_MESSAGE);
  });

  it('選択肢がない場合は明示エラーを投げる', () => {
    const documentRef = documentFrom(`
      <div class="main kako">
        <div id="mondai">問題文だけがあります。</div>
      </div>
    `);

    expect(() => extractProblemFromDocument(documentRef)).toThrow(SELECTOR_ERROR_MESSAGE);
  });

  it('ナビゲーションやフッターのliを混ぜない', () => {
    const documentRef = documentFrom(`
      <nav><ul><li>過去問道場</li><li>掲示板</li></ul></nav>
      <main>
        <div class="main kako">
          <div id="mondai">問題文です。</div>
          <div class="ansbg">
            <ul class="selectList"><li><span id="select_a">正しい対象A</span></li><li><span id="select_i">正しい対象B</span></li></ul>
          </div>
        </div>
      </main>
      <footer><ul><li>利用規約</li><li>お問い合わせ</li></ul></footer>
    `);

    const result = extractProblemFromDocument(documentRef);
    expect(result).toContain('ア 正しい対象A');
    expect(result).not.toContain('過去問道場');
    expect(result).not.toContain('利用規約');
  });

  it('同じ文言の選択肢を重複除去せず保持する', () => {
    const documentRef = documentFrom(`
      <div class="main kako">
        <div id="mondai">同じ文言の選択肢を含む問題です。</div>
        <div class="ansbg">
          <ul class="selectList">
            <li><span id="select_a">同じ選択肢</span></li>
            <li><span id="select_i">同じ選択肢</span></li>
            <li><span id="select_u">別の選択肢</span></li>
            <li><span id="select_e">さらに別の選択肢</span></li>
          </ul>
        </div>
      </div>
    `);

    expect(extractProblemFromDocument(documentRef)).toContain(
      'ア 同じ選択肢\nイ 同じ選択肢\nウ 別の選択肢\nエ さらに別の選択肢'
    );
  });
});

describe('normalizeText', () => {
  it('連続空白・改行・nbspを単一スペースにする', () => {
    expect(normalizeText(' A\u00a0\n\t B  C ')).toBe('A B C');
  });
});
