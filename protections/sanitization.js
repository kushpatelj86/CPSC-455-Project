

export function santize(string)
{
    const regex = /[<>/&'"]/ig
    const newstring = string.replace(regex,'')

    return newstring;
}

