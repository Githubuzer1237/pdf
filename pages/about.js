import React from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";  // Убедитесь, что это импортировано
import Share from "../components/Share";
import pageStyles from "../styles/Page.module.css";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "about"])),
    },
  };
}

const About = () => {
  const { t } = useTranslation();
  const router = useRouter();  // Получаем информацию о маршруте
  const { locale } = router;   // Определяем текущий язык

  // Определяем канонический URL на основе текущего языка
  const canonicalUrl = `https://pdfdok.com${locale === 'en' ? '' : '/' + locale}/about`;

  return (
    <>
      <Head>
        <title>About Us</title>
        <meta
          name="description"
          content="pdfdok.com is your go-to online platform for all PDF-related needs. Easily convert, compress, merge, and edit PDF files without any downloads. Our user-friendly tools ensure fast, reliable, and secure document manipulation. Experience seamless PDF handling and improve your workflow with pdfdok.com."
        />
        <meta
          name="keywords"
          content="PDF tools, PDF converter, PDF editor, PDF compressor, online PDF merge, online PDF split, convert PDF to Word, convert PDF to JPG, edit PDF online, compress PDF files, PDF manipulation, free PDF tools, merge PDF online, PDF tools web app"
        />
        <meta name="robots" content="index,follow" />
        
        {/* Динамический канонический тег */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Альтернативные ссылки для других языков */}
        <link rel="alternate" href="https://pdfdok.com/uk/about" hreflang="uk" />
        <link rel="alternate" href="https://pdfdok.com/ar/about" hreflang="ar" />
        <link rel="alternate" href="https://pdfdok.com/id/about" hreflang="id" />
        <link rel="alternate" href="https://pdfdok.com/de/about" hreflang="de" />
        <link rel="alternate" href="https://pdfdok.com/es/about" hreflang="es" />
        <link rel="alternate" href="https://pdfdok.com/nl/about" hreflang="nl" />
        <link rel="alternate" href="https://pdfdok.com/fr/about" hreflang="fr" />
        <link rel="alternate" href="https://pdfdok.com/hi/about" hreflang="hi" />
        <link rel="alternate" href="https://pdfdok.com/it/about" hreflang="it" />
        <link rel="alternate" href="https://pdfdok.com/ko/about" hreflang="ko" />
        <link rel="alternate" href="https://pdfdok.com/pt/about" hreflang="pt" />
        <link rel="alternate" href="https://pdfdok.com/ja/about" hreflang="ja" />
        <link rel="alternate" href="https://pdfdok.com/ru/about" hreflang="ru" />
        <link rel="alternate" href="https://pdfdok.com/zh/about" hreflang="zh" />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("common:about")}</h1>
        </header>   
        <section className="page_section mt-0">
          <article className="container">
            <section>
              <div className={`${pageStyles.paragraph_text}`}>
                <p>{t("about:paragraph_01")}</p>
                <p>{t("about:paragraph_02")}</p>
                <p>{t("about:paragraph_03")}</p>
                <p>{t("about:paragraph_04")}</p>
              </div>
            </section>
          </article>
        </section>

        <Share />
      </main>
    </>
  );
};

export default About;
