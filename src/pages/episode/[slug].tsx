import { format, parseISO } from "date-fns"
import ptBR from "date-fns/locale/pt-BR"
import { convertDurationToTimeString } from "../../utils/convertDurationTimeToString"

import { GetStaticPaths, GetStaticProps } from "next"
import Image from "next/image"
import Link from 'next/link'
import Head from "next/head"
import { api } from "../../services/api"

import styles from "./episode.module.scss"
import { usePlayer } from "../../contexts/PlayerContext"

type Episode = {
    id: string
    title: string
    thumbnail: string
    members: string
    publishedAt: string
    duration: number
    durationAsString: string
    description: string
    url: string
}

type EpisodeProps = {
    episode: Episode
}

export default function Episode({ episode }: EpisodeProps) {
    const { play } = usePlayer()

    return (
        <div className={styles.episode}>
            <Head>
                <title>{episode.title} | Podcastr</title>
            </Head>
            <div className={styles.thumbnailContainer}>
                <Link href="/">
                    <button type='button'>
                        <img src='/arrow-left.svg' alt='Voltar' />
                    </button>
                </Link>
                <Image
                    width={700}
                    height={160}
                    src={episode.thumbnail}
                    objectFit='cover'
                />
                <button type='button' onClick={() => play(episode)}>
                    <img src='/play.svg' alt='Tocar episódio' />
                </button>
            </div>
            <header>
                <h1>{episode.title}</h1>
                <span>{episode.members}</span>
                <span>{episode.publishedAt}</span>
                <span>{episode.durationAsString}</span>
            </header>
            <div
                className={styles.description}
                dangerouslySetInnerHTML={{ __html: episode.description }} // este comando libera o react ler o código como html, porém é altamente perigoso usar quando não se sabe a fonte das informações lidas.
            />
        </div>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    const { data } = await api.get('episodes', {
        params: {
            _limit: 2,
            _sort: 'published_at',
            _order: 'desc'
        }
    })

    const paths = data.map(episode => {
        return{
            params: {
                slug: episode.id
            }
        }
    })

    return {
        // fallback é um tipo de bloqueio
        paths,
        fallback: "blocking",
        // fallback: true, // quando true, ele faz o carregamento da página do conteúdo independentemente do conteúdo ter sido carregado. Neste caso é necessária a importação do useRouter, para mostrar algo enquanto o conteúdo é carregado.
        // fallback: false, // quando false, ele não carrega o conteúdo, mas carrega a página; sempre retornará um 404
    }
}

export const getStaticProps: GetStaticProps = async (ctx) => {
    const { slug } = ctx.params
    const { data } = await api.get(`/episodes/${slug}`) // episodes (no plural mesmo) é rota criada pelo mockserver. Ele cria de acordo com o que tá dentro do arquivo server.json, que é o array chamado episodes.
    const episode = {
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        members: data.members,
        publishedAt: format(parseISO(data.published_at), "d MMM yy", {
            locale: ptBR,
        }),
        duration: Number(data.file.duration),
        durationAsString: convertDurationToTimeString(
            Number(data.file.duration)
        ),
        description: data.description,
        url: data.file.url,
    }

    return {
        props: { episode },
        revalidate: 60 * 60 * 24, // recarrega o conteúdo a cada 24 horas
    }
}
