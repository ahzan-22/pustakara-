export interface GoogleBook {
  id: string;
  title: string;
  author?: string;
  thumbnail?: string;
  description?: string;
  publishedDate?: string;
}

interface GoogleBooksVolumeItem {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
    description?: string;
    publishedDate?: string;
  };
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolumeItem[];
  totalItems?: number;
}

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

/**
 * Mengambil detail satu buku berdasarkan ID dari Google Books API.
 * Memerlukan GOOGLE_BOOKS_API_KEY di file .env.local
 */
export async function getBookById(id: string): Promise<GoogleBook> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
  const url = `${GOOGLE_BOOKS_API}/${id}${
    apiKey ? `?key=${apiKey}` : ""
  }`;

  const res = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Gagal mengambil detail buku dari Google Books API");
  }

  const data: GoogleBooksVolumeItem = await res.json();

  return {
    id: data.id,
    title: data.volumeInfo.title ?? "Tanpa Judul",
    author: data.volumeInfo.authors?.[0],
    thumbnail: data.volumeInfo.imageLinks?.thumbnail,
    description: data.volumeInfo.description,
    publishedDate: data.volumeInfo.publishedDate,
  };
}

/**
 * Mencari buku melalui Google Books API.
 * Memerlukan GOOGLE_BOOKS_API_KEY di file .env.local
 * Mengembalikan daftar buku yang telah diformat untuk UI.
 */
export async function searchBooks(query: string): Promise<GoogleBook[]> {
  if (!query.trim()) {
    return [];
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
  const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=20${
    apiKey ? `&key=${apiKey}` : ""
  }`;

  const res = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Gagal mencari buku dari Google Books API");
  }

  const data: GoogleBooksResponse = await res.json();

  return (data.items || []).map((item) => ({
    id: item.id,
    title: item.volumeInfo.title ?? "Tanpa Judul",
    author: item.volumeInfo.authors?.[0],
    thumbnail: item.volumeInfo.imageLinks?.thumbnail,
    description: item.volumeInfo.description,
    publishedDate: item.volumeInfo.publishedDate,
  }));
}
